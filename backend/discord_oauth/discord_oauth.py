from aiofiles import open as async_open
from aiohttp import ClientSession
from fastapi import APIRouter, Body, Security, status
from fastapi.exceptions import HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import decode, encode
from orjson import loads, dumps, OPT_INDENT_2

from datetime import datetime, timedelta, timezone
from os import makedirs, urandom
from os.path import isdir, isfile, join
from typing import Literal, Optional, TypeVar

from .schemas import (
    AccessTokenResponse,
    DiscordUser,
    DisplayDiscordUser,
    StorageData,
    JWTData,
    JWT,
)

security = HTTPBearer(
    scheme_name="JWT",
    description="JWT which get from posting discord oauth code to /oauth."
)


T = TypeVar("T")

DISCORD_API = "https://discord.com/api/v10"
DISCORD_USER_DIRECTORY = "data/discord-users"
if not isdir(DISCORD_USER_DIRECTORY):
    makedirs(DISCORD_USER_DIRECTORY)


class DiscordOAuthRouter:
    router: APIRouter = APIRouter(
        prefix="/oauth",
        tags=["Discord OAuth"]
    )
    redirect_uri: str = ""
    client_id: str = ""
    client_secret: str = ""
    key: str = urandom(16).hex()
    admins: list[str] = []

    def __init__(
        self,
        redirect_uri: str,
        client_id: str,
        client_secret: str,
        key: str = urandom(16).hex(),
        prefix: str = "/oauth",
        admins: list[str] = []
    ) -> None:
        self.router.prefix = prefix

        self.redirect_uri = redirect_uri
        self.client_id = client_id
        self.client_secret = client_secret

        self.key = key
        self.admins = admins

        self.router.add_api_route(
            path="",
            endpoint=self.oauth,
            response_model=JWT,
            status_code=status.HTTP_200_OK,
            description="Get token by discord code",
            methods=["POST"]
        )
        self.router.add_api_route(
            path="",
            endpoint=self.refresh,
            response_model=JWT,
            status_code=status.HTTP_200_OK,
            description="Refresh token",
            methods=["PUT"]
        )

    async def _request_to_discord(
        self,
        token: str,
        grant_type: Literal["authorization_code", "refresh_token"]
    ) -> JWT:
        # Exchange token
        async with ClientSession(headers={"Content-Type": "application/x-www-form-urlencoded"}) as client:
            data = {
                "grant_type": "authorization_code",
                "code": token,
                "redirect_uri": self.redirect_uri
            } if grant_type == "authorization_code" else {
                "grant_type": "refresh_token",
                "refresh_token": token
            }
            data["client_id"] = self.client_id
            data["client_secret"] = self.client_secret
            response = await client.post(
                f"{DISCORD_API}/oauth2/token",
                data=data,
            )
            # Valid failed
            if response.status != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authorize failed"
                )
            token_data = AccessTokenResponse(
                **loads(await response.content.read())
            )

        if "identify" not in token_data.scope:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorize failed"
            )
        # Fetch user data
        async with ClientSession(headers={"Authorization": f"{token_data.token_type} {token_data.access_token}"}) as client:
            response = await client.get(
                f"{DISCORD_API}/users/@me"
            )
            user_data = DiscordUser(
                **loads(await response.content.read())
            )

        # Save file to local
        storage_data = StorageData(
            token_data=token_data,
            user_data=user_data,
        )
        async with async_open(join(DISCORD_USER_DIRECTORY, f"{user_data.id}.json"), "wb") as user_file:
            await user_file.write(dumps(
                storage_data.model_dump(), option=OPT_INDENT_2
            ))

        # Generate JWT Data
        utc_now = datetime.now(tz=timezone.utc)
        display_name = user_data.global_name or user_data.username
        display_avatar = f"https://cdn.discordapp.com/avatars/{user_data.id}/{user_data.avatar}.png" if user_data.avatar else "https://cdn.discordapp.com/embed/avatars/0.png"
        jwt_data = JWTData(**user_data.model_dump(), **{
            "is_admin": user_data.id in self.admins,
            "display_name": display_name,
            "display_avatar": display_avatar,
            "exp": utc_now + timedelta(seconds=token_data.expires_in),
            "iat": utc_now,
        })

        # Generate JWT
        jwt_payload = jwt_data.model_dump()
        jwt = encode(
            payload=jwt_payload,
            key=self.key,
            algorithm="HS256"
        )

        return JWT(access_token=jwt)

    @staticmethod
    async def read_local_user(user_id: str, admins: list[str] = []) -> Optional[DisplayDiscordUser]:
        user_file_path = join(DISCORD_USER_DIRECTORY, f"{user_id}.json")
        if not isfile(user_file_path):
            return None
        async with async_open(user_file_path, "rb") as user_file:
            storage_data = StorageData(**loads(
                await user_file.read()
            ))
        user_data = storage_data.user_data

        display_name = user_data.global_name or user_data.username
        display_avatar = f"https://cdn.discordapp.com/avatars/{user_data.id}/{user_data.avatar}.png" if user_data.avatar else "https://cdn.discordapp.com/embed/avatars/0.png"

        return DisplayDiscordUser(
            is_admin=user_data.id in admins,
            display_name=display_name,
            display_avatar=display_avatar,
            **user_data.model_dump(),
        )

    async def valid_token(self, token: HTTPAuthorizationCredentials = Security(security)) -> JWTData:
        jwt = token.credentials
        try:
            decode_data = JWTData(**decode(
                jwt=jwt,
                key=self.key,
                algorithms=["HS256"],
                options={
                    "require": ["exp", "iat"]
                }
            ))
            return decode_data
        except:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid authentication credentials"
            )

    async def oauth(
        self,
        code: str = Body(embed=True)
    ):
        return await self._request_to_discord(code, grant_type="authorization_code")

    async def refresh(self, token: HTTPAuthorizationCredentials = Security(security)) -> JWT:
        # Decode JWT
        try:
            jwt = token.credentials
            jwt_data = JWTData(**decode(
                jwt=jwt,
                key=self.key,
                algorithms=["HS256"],
                options={
                    "require": ["exp", "iat"],
                    "verify_exp": False
                }
            ))
        except:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid authentication credentials"
            )

        if jwt_data.exp - datetime.now(timezone.utc) > timedelta(days=1):
            return JWT(access_token=jwt)

        # Read User Data
        async with async_open(join(DISCORD_USER_DIRECTORY, f"{jwt_data.id}.json"), "rb") as user_file:
            storage_data = StorageData(**loads(await user_file.read()))

        return await self._request_to_discord(
            token=storage_data.token_data.refresh_token,
            grant_type="refresh_token"
        )
