from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn import Config, Server

from config import HOST, PORT

from .oauth import discord_oauth_router
from .routers import (
    ticket_router,
    user_router,
)

app = FastAPI(
    title="PD2 Ticket",
    description="System for student display code to TA.",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(discord_oauth_router.router)
app.include_router(ticket_router)
app.include_router(user_router)


@app.get("/version", tags=["Info"])
def get_app_version() -> str:
    return app.version


@app.get("/ping", tags=["Info"])
def ping() -> str:
    return "pong"


async def run_api():
    config = Config(
        app=app,
        host=HOST,
        port=PORT
    )
    server = Server(config=config)
    await server.serve()
