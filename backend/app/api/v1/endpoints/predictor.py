"""Monte Carlo championship predictor endpoints."""
from fastapi import APIRouter, HTTPException

from app.models.schemas import PredictRequest, PredictResponse
from app.services import predictor_service
from app.services.errors import UpstreamDataUnavailableError

router = APIRouter(prefix="/predictor", tags=["predictor"])


@router.post("/simulate", response_model=PredictResponse)
def simulate(request: PredictRequest) -> PredictResponse:
    """Predict championship win probabilities via Monte Carlo simulation.

    Send an optional `overrides` list to run a What-If scenario (e.g. boost a
    driver's per-race DNF probability and see how title odds change).
    """
    try:
        payload = predictor_service.get_predict_payload(
            season=request.season,
            n_simulations=request.n_simulations,
            seed=request.seed,
            remaining_races=request.remaining_races,
            overrides=request.overrides,
        )
    except UpstreamDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=exc.message) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return PredictResponse(**payload)
