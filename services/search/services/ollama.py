import json
from typing import Any

import httpx

from utils.exceptions import ExternalServiceError


class OllamaClient:
    """Async client for Ollama text generation."""

    def __init__(
        self,
        base_url: str,
        model: str,
        timeout_seconds: float,
        http_client: httpx.AsyncClient,
    ) -> None:
        """Initialize the Ollama client."""
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout_seconds = timeout_seconds
        self._http_client = http_client

    async def generate_json(self, prompt: str) -> dict[str, Any]:
        """Generate and parse a JSON object from Ollama."""
        payload: dict[str, Any] = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }

        try:
            response = await self._http_client.post(
                f"{self._base_url}/api/generate",
                json=payload,
                timeout=self._timeout_seconds,
            )
            response.raise_for_status()
            body = response.json()
            generated = body.get("response")
            if not isinstance(generated, str):
                raise ExternalServiceError("Ollama response did not contain text.")
            parsed = json.loads(generated)
        except (httpx.HTTPError, json.JSONDecodeError) as exc:
            import logging
            logging.error("Ollama client error detail: %s", exc, exc_info=True)
            raise ExternalServiceError(f"Ollama planner request failed: {exc}") from exc

        if not isinstance(parsed, dict):
            raise ExternalServiceError("Ollama response was not a JSON object.")
        return parsed
