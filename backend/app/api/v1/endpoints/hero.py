"""Hero / 'Podium Spotlight' endpoints."""

from fastapi import APIRouter, HTTPException, Query, Response

from app.core.cache_deps import cache_response, set_cache_headers
from app.models.schemas import HeroResponse
from app.services import race_service
from app.services.errors import UpstreamDataUnavailableError

router = APIRouter(prefix="/hero", tags=["hero"])


@router.get("/latest", response_model=HeroResponse)
def latest_hero(
    response: Response,
    season: int | None = Query(
        default=None, ge=1950, le=2100,
        description="Season year. Defaults to the current year.",
    ),
    round: int | None = Query(
        default=None, ge=1,
        description="Optional specific GP round. Defaults to most recent completed.",
    ),
    refresh: bool = Query(
        default=False, description="Set to force a cache bypass / recompute.",
    ),
) -> HeroResponse:
    """Return the podium/winner spotlight for a grand prix."""
    try:
        payload, status = cache_response(
            key_tuple=("hero_latest", season, round),
            compute=lambda: race_service.get_hero_payload(
                season=season, gp_round=round
            ),
            force_refresh=refresh,
        )
    except UpstreamDataUnavailableError as exc:
        # Translate our domain error into a clean HTTP 503 (Service Unavailable).
        raise HTTPException(status_code=503, detail=exc.message) from exc
    set_cache_headers(response, status)
    return HeroResponse(**payload)
