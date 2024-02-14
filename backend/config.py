from orjson import dumps, loads, OPT_INDENT_2
from pydantic import BaseModel

from os import urandom


class Config(BaseModel):
    host: str = "0.0.0.0"
    port: int = 8080
    key: str = urandom(16).hex()
    redirect_uri: str = ""
    client_id: str = ""
    client_secret: str = ""
    admins: list[str] = []


try:
    with open("config.json", "rb") as config_file:
        config = Config(**loads(
            config_file.read()
        ))
except:
    config = Config()
    with open("config.json", "wb") as config_file:
        config_file.write(dumps(
            config.model_dump(),
            option=OPT_INDENT_2
        ))


HOST = config.host
PORT = config.port
KEY = config.key
REDIRECT_URI = config.redirect_uri
CLIENT_ID = config.client_id
CLIENT_SECRET = config.client_secret
ADMINS = config.admins
