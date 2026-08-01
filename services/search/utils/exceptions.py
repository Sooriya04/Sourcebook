from fastapi import FastAPI, Request, status
from fastapi.responses import ORJSONResponse
from loguru import logger


class SearchServiceError(Exception):
    """Base exception for expected service failures."""

    def __init__(self, message: str) -> None:
        """Initialize the service exception."""
        super().__init__(message)
        self.message = message


class ExternalServiceError(SearchServiceError):
    """Raised when Ollama or SearXNG returns an unusable response."""


class PlannerError(SearchServiceError):
    """Raised when the planner cannot produce a valid search plan."""


def register_exception_handlers(app: FastAPI) -> None:
    """Register API exception handlers."""

    @app.exception_handler(SearchServiceError)
    async def service_error_handler(
        request: Request,
        exc: SearchServiceError,
    ) -> ORJSONResponse:
        """Convert expected service errors into JSON responses."""
        logger.warning("Service error on {}: {}", request.url.path, exc.message)
        return ORJSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={"detail": exc.message},
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(
        request: Request,
        exc: Exception,
    ) -> ORJSONResponse:
        """Convert unexpected exceptions into JSON responses."""
        logger.exception("Unhandled error on {}: {}", request.url.path, exc)
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error."},
        )
