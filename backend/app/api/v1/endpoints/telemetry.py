from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import TelemetryComparisonResponse
from app.services import telemetry_service
from app.services.errors import UpstreamDataUnavailableError

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

_VALID_SESSIONS = ("FP1", "FP2", "FP3", "Q", "S", "R")


@router.get("/compare", response_model=TelemetryComparisonResponse)
def compare(
    driver_a: str = Query(..., min_length=3, max_length=3,
                          description="3-letter code of driver A, e.g. 'NOR'."),
    driver_b: str = Query(..., min_length=3, max_length=3,
                          description="3-letter code of driver B, e.g. 'VER'."),
    season: int | None = Query(default=None, ge=1950, le=2100,
                               description="Season year. Defaults to current."),
    round: int = Query(..., ge=1,
                      description="GP round to analyse (required)."),
    session: str = Query(default="Q",
                         description="Session type: FP1/FP2/FP3/Q/S/R. Default 'Q'."),
    max_points: int = Query(default=1500, ge=50, le=10000,
                            description="Max telemetry samples per driver."),
) -> TelemetryComparisonResponse:
    """Return aligned telemetry for two drivers on their fastest lap."""
    s = session.upper()
    if s not in _VALID_SESSIONS:
        raise HTTPException(status_code=422, detail=f"Invalid session '{session}'.")
    try:
        payload = telemetry_service.get_compare_payload(
            season=season, gp_round=round, session_type=s,
            driver_a=driver_a.upper(), driver_b=driver_b.upper(),
            max_points=max_points,
        )
    except UpstreamDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=exc.message) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return TelemetryComparisonResponse(**payload)
