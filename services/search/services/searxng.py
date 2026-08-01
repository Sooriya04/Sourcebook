from typing import Any

import httpx
from loguru import logger

from models.response import SearchResult
from utils.exceptions import ExternalServiceError


class SearxngClient:
    """Async client for querying SearXNG."""

    def __init__(
        self,
        base_url: str,
        timeout_seconds: float,
        http_client: httpx.AsyncClient,
    ) -> None:
        """Initialize the SearXNG client."""
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds
        self._http_client = http_client

    async def search(self, query: str, max_results: int) -> list[SearchResult]:
        """Execute a query against SearXNG and normalize the results."""
        params: dict[str, str] = {
            "q": query,
            "format": "json",
            "language": "en",
            "safesearch": "1",
        }

        try:
            response = await self._http_client.get(
                f"{self._base_url}/search",
                params=params,
                timeout=self._timeout_seconds,
            )
            response.raise_for_status()
            payload = response.json()
        except httpx.HTTPError as exc:
            raise ExternalServiceError("SearXNG search request failed.") from exc

        raw_results = payload.get("results", [])
        if not isinstance(raw_results, list):
            raise ExternalServiceError("SearXNG returned an invalid results payload.")

        results = self._normalize_results(raw_results, max_results)
        logger.info(
            "SearXNG query completed query={!r} results={}",
            query,
            len(results),
        )
        return results

    def _normalize_results(
        self,
        raw_results: list[Any],
        max_results: int,
    ) -> list[SearchResult]:
        normalized: list[SearchResult] = []
        seen_urls: set[str] = set()

        for item in raw_results:
            if not isinstance(item, dict):
                continue

            title = item.get("title")
            url = item.get("url")
            if not isinstance(title, str) or not isinstance(url, str):
                continue
            if url in seen_urls:
                continue

            seen_urls.add(url)
            normalized.append(
                SearchResult(
                    title=title.strip(),
                    url=url,
                    snippet=str(item.get("content") or "").strip(),
                )
            )

            if len(normalized) >= max_results:
                break

        return normalized
