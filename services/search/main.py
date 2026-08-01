from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

# pyrefly: ignore [missing-import]
import httpx
import uvicorn
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse

from api.routes import create_router
from config import Settings, get_settings
from services.ollama import OllamaClient
from services.planner import PlannerService
from services.search import SearchService
from services.searxng import SearxngClient
from utils.exceptions import register_exception_handlers
from utils.logger import configure_logger, request_logging_middleware


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    configure_logger(settings.log_level, settings.log_json)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        async with httpx.AsyncClient() as client:
            ollama_client = OllamaClient(
                base_url=str(settings.ollama_url),
                model=settings.ollama_model,
                timeout_seconds=settings.ollama_timeout_seconds,
                http_client=client,
            )
            searxng_client = SearxngClient(
                base_url=str(settings.searxng_url),
                timeout_seconds=settings.searxng_timeout_seconds,
                http_client=client,
            )
            planner_service = PlannerService(
                ollama_client=ollama_client,
                max_queries=settings.planner_max_queries,
            )
            app.state.search_service = SearchService(
                planner_service=planner_service,
                searxng_client=searxng_client,
                default_max_results=settings.searxng_max_results,
            )
            yield

    app = FastAPI(
        title=settings.service_name,
        version="0.1.0",
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )
    app.middleware("http")(request_logging_middleware)
    register_exception_handlers(app)
    app.include_router(create_router(settings))
    return app


def main() -> None:
    """Run the API server for local development."""
    settings: Settings = get_settings()
    uvicorn.run(
        "main:create_app",
        host=settings.host,
        port=settings.port,
        factory=True,
        reload=settings.environment in {"local", "development"},
    )


if __name__ == "__main__":
    main()
