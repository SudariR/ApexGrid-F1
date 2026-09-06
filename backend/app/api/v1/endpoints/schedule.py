"""Schedule endpoints for the full season race calendar / timeline."""
from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import ScheduleResponse
from app.services import schedule_service
from app.services.errors import UpstreamDataUnavailableError

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.get("", response_model=ScheduleResponse)
def get_schedule(
    season: int | None = Query(
        default=None,
        ge=1950,
        le=2100,
        description="Season year. Defaults to current year.",
    ),
) -> ScheduleResponse:
    """Return the full official race schedule for a season."""
    try:
        payload = schedule_service.get_season_schedule(year=season)
    except UpstreamDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=503, detail="Schedule data temporarily unavailable."
        ) from exc
    return ScheduleResponse(**payload)
