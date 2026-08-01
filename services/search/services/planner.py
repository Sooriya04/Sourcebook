from pathlib import Path
from typing import Any

from pydantic import ValidationError

from models.planner import SearchPlan
from services.ollama import OllamaClient
from utils.exceptions import PlannerError


class PlannerService:
    """Create structured search plans using an LLM."""

    def __init__(self, ollama_client: OllamaClient, max_queries: int) -> None:
        """Initialize the planner service."""
        self._ollama_client = ollama_client
        self._max_queries = max_queries
        self._prompt_template = self._load_prompt_template()

    async def plan(self, user_query: str) -> SearchPlan:
        """Generate a validated search plan for a user query."""
        prompt = self._prompt_template.format(
            user_query=user_query,
            max_queries=self._max_queries,
        )
        raw_plan: dict[str, Any] = await self._ollama_client.generate_json(prompt)

        try:
            plan = SearchPlan.model_validate(raw_plan)
        except ValidationError as exc:
            raise PlannerError("Planner returned an invalid search plan.") from exc

        return SearchPlan(
            intent=plan.intent,
            objective=plan.objective,
            entities=plan.entities,
            keywords=plan.keywords,
            queries=plan.queries[: self._max_queries],
        )

    def _load_prompt_template(self) -> str:
        prompt_path = Path(__file__).resolve().parent.parent / "prompts" / "planner.txt"
        return prompt_path.read_text(encoding="utf-8")
