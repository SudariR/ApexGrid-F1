"""Teammate qualifying head-to-head + Elo endpoints."""
from fastapi import APIRouter, HTTPException, Query, Response

from app.core.cache_deps import cache_response, set_cache_headers
from app.models.schemas import HeadToHeadResponse
from app.services import headtohead_service
from app.services.errors import UpstreamDataUnavailableError

router = APIRouter(prefix="/headtohead", tags=["head-to-head"])


@router.get("/teammates", response_model=HeadToHeadResponse)
def teammates(
    response: Response,
    season: int | None = Query(default=None, ge=1950, le=2100,
                               description="Season year. Defaults to current."),
    refresh: bool = Query(default=False,
                          description="Force cache bypass / recompute."),
) -> HeadToHeadResponse:
    """Teammate qualifying head-to-head records + Elo ratings for a season."""
    try:
        payload, status = cache_response(
            key_tuple=("headtohead", season),
            compute=lambda: headtohead_service.get_headtohead_payload(season=season),
            force_refresh=refresh,
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Data temporarily unavailable.") from exc
    set_cache_headers(response, status)
    return HeadToHeadResponse(**payload)
