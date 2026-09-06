from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import HeadToHeadResponse
from app.services import headtohead_service
from app.services.errors import UpstreamDataUnavailableError

router = APIRouter(prefix="/headtohead", tags=["head-to-head"])


@router.get("/teammates", response_model=HeadToHeadResponse)
def teammates(
    season: int | None = Query(default=None, ge=1950, le=2100,
                               description="Season year. Defaults to current."),
) -> HeadToHeadResponse:
    """Teammate qualifying head-to-head records + Elo ratings for a season."""
    try:
        payload = headtohead_service.get_headtohead_payload(season=season)
    except UpstreamDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Data temporarily unavailable.") from exc
    return HeadToHeadResponse(**payload)
