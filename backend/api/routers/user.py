from fastapi import APIRouter, HTTPException, status

from discord_oauth import DiscordOAuthRouter, DisplayDiscordUser

from ..oauth import user_depends

router = APIRouter(
    prefix="/user",
    tags=["User"],
    dependencies=[user_depends]
)

@router.get(
    path="/{user_id}",
    response_model=DisplayDiscordUser,
    status_code=status.HTTP_200_OK,
    description="Get user info by user ID"
)
async def get_user(user_id: int):
    user = await DiscordOAuthRouter.read_local_user(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
