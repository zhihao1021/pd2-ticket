from asyncio import run

from api import run_api

async def main():
    await run_api()


if __name__ == "__main__":
    run(main=main())
