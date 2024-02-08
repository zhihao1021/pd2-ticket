from pydantic import BaseModel, Field

from datetime import datetime
from typing import Optional


class Ticket(BaseModel):
    ticket_id: str
    author_id: int
    create_utc_timestamp: float = Field(
        default_factory=datetime.utcnow().timestamp
    )
    files: list[str] = []
    public: bool = False


class TicketUpdate(BaseModel):
    public: Optional[bool] = None
