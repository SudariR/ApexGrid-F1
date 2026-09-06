"""Championship standings endpoints (Drivers + Constructors)."""
from fastapi import APIRouter, HTTPException, Query, Response

from app.core.cache_deps import cache_response, set_cache_headers
from app.models.schemas import StandingsResponse
from app.services import standings_service
from app.services.errors import UpstreamDataUnavailableError

router = APIRouter(prefix="/standings", tags=["standings"])


@router.get("", response_model=StandingsResponse)
def get_standings(
    response: Response,
    season: int | None = Query(
        default=None, ge=1950, le=2100,
        description="Season year. Defaults to the current year.",
    ),
    refresh: bool = Query(
        default=False, description="Set to force a cache bypass / recompute.",
    ),
) -> StandingsResponse:
    """Return Drivers' and Constructors' standings as of the latest GP."""
    try:
        payload, status = cache_response(
            key_tuple=("standings", season),
            compute=lambda: standings_service.get_standings_payload(season=season),
            force_refresh=refresh,
        )
    except Exception as exc:  # ergast/network unexpected failures -> clean 503
        raise HTTPException(
            status_code=503, detail="Standings data temporarily unavailable."
        ) from exc
    set_cache_headers(response, status)
    return StandingsResponse(**payload)
