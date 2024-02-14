from aiofiles import open as async_open
from fastapi import APIRouter, Form, HTTPException, Response, status, UploadFile
from fastapi.responses import StreamingResponse
from orjson import dumps, loads, OPT_INDENT_2

from asyncio import create_task, gather, get_event_loop
from datetime import datetime
from hashlib import sha1
from io import BytesIO
from os import listdir, makedirs, remove, urandom
from os.path import isdir, isfile, join, split
from pathlib import Path
from shutil import make_archive, rmtree
from typing import Union, Literal

from config import KEY
from schemas.ticket import Ticket, TicketUpdate

from ..oauth import UserDepends
from ..schemas import HTTPError

router = APIRouter(
    prefix="/ticket",
    tags=["Ticket"]
)

TICKET_DIRECTORY = "data/tickets"
if not isdir(TICKET_DIRECTORY):
    makedirs(TICKET_DIRECTORY)


def generate_ticket_id(user_id: str) -> str:
    random_hash = sha1(
        f"{KEY}-{user_id}".encode("utf-8") + urandom(16)
    ).hexdigest()
    return f"{datetime.now().isoformat()}H{random_hash}".replace(":", "_")


def read_user_ticket_list(user_id: str) -> list[str]:
    target_directory = join(TICKET_DIRECTORY, user_id)
    if not isdir(target_directory):
        return []
    return listdir(target_directory)


@router.get(
    path="",
    status_code=status.HTTP_200_OK,
    description="Get your own ticket list",
)
def get_self_list(user: UserDepends) -> list[str]:
    return read_user_ticket_list(user_id=user.id)


@router.post(
    path="",
    status_code=status.HTTP_201_CREATED,
    description="Create a new ticket",
)
async def upload_files(
    user: UserDepends,
    files: list[UploadFile],
    public: bool = Form(False),
) -> str:
    # Check if file path is legal
    def check_filename(file: UploadFile) -> bool:
        filename = file.filename
        if filename is None:
            return False
        for c in ":*?\"<>|~":
            if c in filename:
                return False
        return True
    accept_files = list(filter(check_filename, files))

    # Check filesize
    filesize = sum(map(lambda file: file.size, accept_files))
    if filesize > 16 * 1024 * 1024:  # 16MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File oversize"
        )

    # Generate ticket id
    ticket_id = generate_ticket_id(user.id)
    ticket_directory = Path(join(TICKET_DIRECTORY, str(user.id), ticket_id))
    save_directory = Path(join(ticket_directory, "data"))

    # Ticket data
    ticket_data = Ticket(
        ticket_id=ticket_id,
        author_id=user.id,
        public=public,
    )

    async def write_to_file(file: UploadFile):
        if file.filename is None:
            return
        filename = file.filename.replace("\\", "/")
        target_path = Path(join(save_directory, filename))
        try:
            async with async_open(target_path, "wb") as open_file:
                await open_file.write(await file.read())
            ticket_data.files.append(filename)
        except:
            pass

    tasks = []
    for file in accept_files:
        # Check if path is legal
        target_path = Path(join(save_directory, file.filename))
        if not target_path.resolve().is_relative_to(save_directory.resolve()):
            continue

        # If legal, make directory
        target_directory, _ = split(target_path)
        if not isdir(target_directory):
            makedirs(target_directory)
        tasks.append(create_task(write_to_file(file)))
    if len(tasks) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can't create empty ticket"
        )
    await gather(*tasks)

    # Save ticket info to file
    ticket_data.files = list(set(ticket_data.files))
    async with async_open(join(ticket_directory, "data.json"), "wb") as data_file:
        await data_file.write(dumps(
            ticket_data.model_dump(),
            option=OPT_INDENT_2
        ))

    return ticket_id


@router.put(
    path="",
    status_code=status.HTTP_200_OK,
    response_model=Ticket,
    description="Modify your ticket by ticket ID"
)
async def modify_ticket(user: UserDepends, ticket_id: str, data: TicketUpdate):
    data_file_path = join(TICKET_DIRECTORY, user.id, ticket_id, "data.json")
    if not isfile(data_file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    try:
        # Read config file
        async with async_open(data_file_path, "rb") as data_file:
            ticket_data = Ticket(**loads(
                await data_file.read()
            ))

        # Update config
        update_data = data.model_dump(exclude_defaults=True)
        for key, value in update_data.items():
            setattr(ticket_data, key, value)

        # Save change
        async with async_open(data_file_path, "wb") as data_file:
            await data_file.write(dumps(
                ticket_data.model_dump(),
                option=OPT_INDENT_2
            ))

        return ticket_data
    except:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Fail to edit"
        )


@router.delete(
    path="",
    status_code=status.HTTP_204_NO_CONTENT,
    description="Delete your ticket by ticket ID"
)
async def delete_ticket(user: UserDepends, ticket_id: str):
    target_directory = join(TICKET_DIRECTORY, user.id, ticket_id)
    if not isdir(target_directory):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    try:
        rmtree(target_directory)
    except:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Fail to delete"
        )


@router.get(
    path="/{user_id}",
    status_code=status.HTTP_200_OK,
    description="Get user ticket list by user ID, use @me ref yourself"
)
def get_user_list(user: UserDepends, user_id: Union[int, Literal["@me"]]) -> list[str]:
    user_id = user.id if user_id == "@me" else str(user_id)
    if user_id != user.id and not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    return read_user_ticket_list(user_id=user_id)


@router.get(
    path="/{user_id}/{ticket_id}",
    status_code=status.HTTP_200_OK,
    response_model=Ticket,
    description="Get user ticket by user ID and ticket ID, use @me ref yourself"
)
async def get_user_ticket(
    user: UserDepends,
    user_id: Union[int, Literal["@me"]],
    ticket_id: str,
) -> Ticket:
    user_id = user.id if user_id == "@me" else str(user_id)
    target_directory = join(TICKET_DIRECTORY, user_id, ticket_id)
    data_file_file = join(target_directory, "data.json")
    if not isfile(data_file_file):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config data not found"
        )

    # Read ticket config
    async with async_open(data_file_file, "rb") as data_file:
        ticket_data = Ticket(**loads(
            await data_file.read()
        ))

    # Check if ticket is accessor's or accessor is admin or ticket is public
    if user_id != user.id and not user.is_admin and not ticket_data.public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    return ticket_data


@router.get(
    path="/{user_id}/{ticket_id}/file",
    status_code=status.HTTP_200_OK,
    description="Get user ticket by user ID and ticket ID, use @me ref yourself",
)
async def get_user_ticket(
    user: UserDepends,
    user_id: Union[int, Literal["@me"]],
    ticket_id: str,
    filename: str,
    response: Response
) -> str:
    user_id = user.id if user_id == "@me" else str(user_id)
    target_directory = join(TICKET_DIRECTORY, user_id, ticket_id)
    data_file_file = join(target_directory, "data.json")
    if not isfile(data_file_file):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config data not found"
        )

    # Read ticket config
    async with async_open(data_file_file, "rb") as data_file:
        ticket_data = Ticket(**loads(
            await data_file.read()
        ))

    # Check if ticket is accessor's or accessor is admin or ticket is public
    if user_id != user.id and not user.is_admin and not ticket_data.public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )

    if filename not in ticket_data.files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Try to read file
    file_path = join(target_directory, "data", filename)
    try:
        async with async_open(file_path, "r", encoding="utf-8") as file:
            context = await file.read()
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is not text file"
        )
    
    response.headers["Cache-Control"] = "max-age=600"
    return context


@router.get(
    path="/{user_id}/{ticket_id}/download",
    status_code=status.HTTP_200_OK,
    description="Get user ticket by user ID and ticket ID, use @me ref yourself"
)
async def get_user_ticket(
    user: UserDepends,
    user_id: Union[int, Literal["@me"]],
    ticket_id: str,
    response: Response,
    # filename: Optional[str] = None
):
    user_id = user.id if user_id == "@me" else str(user_id)
    target_directory = join(TICKET_DIRECTORY, user_id, ticket_id)
    data_file_file = join(target_directory, "data.json")
    if not isfile(data_file_file):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config data not found"
        )

    # Read ticket config
    async with async_open(data_file_file, "rb") as data_file:
        ticket_data = Ticket(**loads(
            await data_file.read()
        ))

    # Check if ticket is accessor's or accessor is admin or ticket is public
    if user_id != user.id and not user.is_admin and not ticket_data.public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )

    # try:
    if not isdir("temp"):
        makedirs("temp")

    def generate_zip() -> str:
        zip_filename = make_archive(
            base_name=f"temp/{user.id}-{ticket_id[:6]}",
            format="zip",
            root_dir=join(target_directory, "data")
        )
        return zip_filename
    loop = get_event_loop()
    zip_path = await loop.run_in_executor(None, generate_zip)
    async with async_open(zip_path, "rb") as zip_file:
        zip_io = BytesIO(await zip_file.read())
    remove(zip_path)

    response.headers["Cache-Control"] = "max-age=600"
    return StreamingResponse(zip_io)
