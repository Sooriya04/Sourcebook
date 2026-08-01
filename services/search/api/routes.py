from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status

from config import Settings
from models.request import SearchRequest
from models.response import HealthResponse, SearchResponse
from services.search import SearchService


def get_search_service(request: Request) -> SearchService:
    """Resolve the search service from FastAPI application state."""
    return request.app.state.search_service


def create_router(settings: Settings) -> APIRouter:
    """Create HTTP routes for the SourceBook Search Service."""
    router = APIRouter(prefix="/api/sourcebook/v1", tags=["search"])

    @router.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        """Return service health metadata."""
        return HealthResponse(
            service=settings.service_name,
            environment=settings.environment,
            status="ok",
        )

    @router.post(
        "/search",
        response_model=SearchResponse,
        status_code=status.HTTP_200_OK,
    )
    async def search(
        payload: SearchRequest,
        service: Annotated[SearchService, Depends(get_search_service)],
    ) -> SearchResponse:
        """Plan and execute web searches for the supplied query."""
        return await service.search(payload)

    @router.get("/search", response_model=SearchResponse)
    async def search_get(
        q: Annotated[str, Query(min_length=1)],
        service: Annotated[SearchService, Depends(get_search_service)],
        max_results: Annotated[int | None, Query(ge=1, le=50)] = None,
    ) -> SearchResponse:
        """Plan and execute web searches from query parameters."""
        return await service.search(SearchRequest(query=q, max_results=max_results))

    return router
