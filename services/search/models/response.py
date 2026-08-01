from typing import Literal

from pydantic import AnyHttpUrl, BaseModel, Field

from models.planner import SearchPlan


class HealthResponse(BaseModel):
    """Health response returned by the service."""

    service: str
    environment: str
    status: Literal["ok"]


class SearchResult(BaseModel):
    """Normalized result returned from a search provider."""

    title: str = Field(min_length=1)
    url: AnyHttpUrl
    snippet: str = ""


class SearchResponse(BaseModel):
    """Response containing the generated search plan and provider results."""

    query: str
    plan: SearchPlan
    results: list[SearchResult]
    result_count: int
