"""Monte Carlo championship predictor endpoints."""
import json

from fastapi import APIRouter, HTTPException, Query, Response

from app.core.cache_deps import cache_response, set_cache_headers
from app.models.schemas import PredictRequest, PredictResponse
from app.services import predictor_service
from app.services.errors import UpstreamDataUnavailableError

router = APIRouter(prefix="/predictor", tags=["predictor"])


@router.post("/simulate", response_model=PredictResponse)
def simulate(
    request: PredictRequest,
    response: Response,
    refresh: bool = Query(
        default=False, description="Force cache bypass / recompute.",
    ),
) -> PredictResponse:
    """Predict championship win probabilities via Monte Carlo simulation.
    """
    # Deterministic cache key from the full request (sort_keys for stability).
    key = json.dumps(request.model_dump(mode="json"), sort_keys=True, default=str)
    try:
        payload, status = cache_response(
            key_tuple=("predictor", key),
            compute=lambda: predictor_service.get_predict_payload(
                season=request.season,
                n_simulations=request.n_simulations,
                seed=request.seed,
                remaining_races=request.remaining_races,
                overrides=request.overrides,
            ),
            force_refresh=refresh,
        )
    except UpstreamDataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=exc.message) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    set_cache_headers(response, status)
    return PredictResponse(**payload)
