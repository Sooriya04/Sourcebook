from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    """Client request for planned web search."""

    query: str = Field(min_length=1, max_length=100_000)
    max_results: int | None = Field(default=None, ge=1, le=50)
