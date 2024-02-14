from pydantic import BaseModel, field_validator

from datetime import datetime
from typing import Optional, Union


class AccessTokenResponse(BaseModel):
    access_token: str = ""
    token_type: str = "Bearer"
    expires_in: int = 604800
    refresh_token: str = ""
    scope: str = "identify"


class DiscordUser(BaseModel):
    id: str
    username: str
    global_name: Optional[str]
    avatar: Optional[str]


class DisplayDiscordUser(DiscordUser):
    is_admin: bool
    display_name: str
    display_avatar: str


class StorageData(BaseModel):
    token_data: AccessTokenResponse
    user_data: DiscordUser


class JWTData(DisplayDiscordUser):
    exp: datetime
    iat: datetime

    @field_validator("exp", "iat")
    @classmethod
    def datetime_check(cls, v: Union[datetime, int]):
        try:
            return datetime.fromtimestamp(v) if type(v) is not datetime else v
        except:
            raise ValueError


class JWT(BaseModel):
    token_type: str = "Bearer"
    access_token: str
