"""Analytics endpoints: pace consistency & tire degradation."""
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import PaceResponse, TireDegradationResponse
from app.services import analytics_service
from app.services.errors import UpstreamDataUnavailableError

router = APIRouter(prefix="/analytics", tags=["analytics"])

_VALID_SESSIONS = ("FP1", "FP2", "FP3", "Q", "S", "R")


def _year_default() -> int:
    return datetime.now().year


@router.get("/pace", response_model=PaceResponse)
def pace(
    driver: str = Query(..., min_length=3, max_length=3,
                        description="3-letter driver code, e.g. 'NOR'."),
    round: int = Query(..., ge=1,
                       description="GP round to analyse (required)."),
    season: int | None = Query(default=None, ge=1950, le=2100,
                               description="Season year. Defaults to current."),
    session: str = Query(default="R",
                         description="Session: FP1/FP2/FP3/Q/S/R. Default 'R'."),
) -> PaceResponse:
    """Pace consistency statistics for a driver's clean laps."""
    s = session.upper()
    if s not in _VALID_SESSIONS:
        raise HTTPException(status_code=422, detail=f"Invalid session '{session}'.")
    year = season or _year_default()
    try:
        payload = analytics_service.get_pace_payload(
            year, round, s, driver.upper()
        )
    except UpstreamDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=exc.message) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return PaceResponse(**payload)


@router.get("/tire-degradation", response_model=TireDegradationResponse)
def tire_degradation(
    driver: str = Query(..., min_length=3, max_length=3,
                        description="3-letter driver code, e.g. 'NOR'."),
    round: int = Query(..., ge=1,
                       description="GP round to analyse (required)."),
    season: int | None = Query(default=None, ge=1950, le=2100,
                               description="Season year. Defaults to current."),
    session: str = Query(default="R",
                         description="Session: FP1/FP2/FP3/Q/S/R. Default 'R'."),
) -> TireDegradationResponse:
    """Tire degradation (seconds/lap) per stint for a driver."""
    s = session.upper()
    if s not in _VALID_SESSIONS:
        raise HTTPException(status_code=422, detail=f"Invalid session '{session}'.")
    year = season or _year_default()
    try:
        payload = analytics_service.get_tire_payload(
            year, round, s, driver.upper()
        )
    except UpstreamDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=exc.message) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return TireDegradationResponse(**payload)
