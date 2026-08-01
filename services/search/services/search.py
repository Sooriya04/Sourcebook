import asyncio

# pyrefly: ignore [missing-import]
from loguru import logger

from models.request import SearchRequest
from models.response import SearchResponse, SearchResult
from services.planner import PlannerService
from services.searxng import SearxngClient


class SearchService:
    """Orchestrate query planning and web search execution."""

    def __init__(
        self,
        planner_service: PlannerService,
        searxng_client: SearxngClient,
        default_max_results: int,
    ) -> None:
        """Initialize the search orchestration service."""
        self._planner_service = planner_service
        self._searxng_client = searxng_client
        self._default_max_results = default_max_results

    async def search(self, request: SearchRequest) -> SearchResponse:
        """Create a search plan and execute supported provider queries."""
        plan = await self._planner_service.plan(request.query)
        max_results = request.max_results or self._default_max_results
        logger.info(
            "Search plan generated intent={!r} planned_queries={} max_results={}",
            plan.intent,
            len(plan.queries),
            max_results,
        )

        result_groups = await asyncio.gather(
            *[
                self._searxng_client.search(planned_query.query, max_results)
                for planned_query in plan.queries
            ]
        )
        results = self._deduplicate_results(
            [result for group in result_groups for result in group],
            max_results,
        )
        logger.info(
            "Search orchestration completed query_length={} result_count={}",
            len(request.query),
            len(results),
        )

        return SearchResponse(
            query=request.query,
            plan=plan,
            results=results,
            result_count=len(results),
        )

    def _deduplicate_results(
        self,
        results: list[SearchResult],
        max_results: int,
    ) -> list[SearchResult]:
        deduplicated: list[SearchResult] = []
        seen_urls: set[str] = set()

        for result in results:
            url = str(result.url)
            if url in seen_urls:
                continue
            seen_urls.add(url)
            deduplicated.append(result)
            if len(deduplicated) >= max_results:
                break

        return deduplicated
