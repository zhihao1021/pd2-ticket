from fastapi import Depends

from typing import Annotated

from config import (
    REDIRECT_URI,
    CLIENT_ID,
    CLIENT_SECRET,
    KEY,
)
from discord_oauth import DiscordOAuthRouter, JWTData

discord_oauth_router = DiscordOAuthRouter(
    redirect_uri=REDIRECT_URI,
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    key=KEY
)

user_depends = Depends(discord_oauth_router.valid_token)
UserDepends = Annotated[JWTData, user_depends]
