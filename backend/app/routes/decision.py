from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.config import settings
from app.decision_engine import evaluate_decision_model, simulate_day_ahead_procurement
from app.schemas import RiskEvaluationResponse, SimulationResponse

router = APIRouter(prefix="/api/decision", tags=["Trading Decision Engine"])

@router.get("/simulate", response_model=SimulationResponse)
def simulate_procurement(
    target_date: str = Query("2026-01-15", description="Target delivery date (YYYY-MM-DD)"),
    cutoff_time: str = Query(settings.default_decision_time_utc, description="Decision cutoff time in UTC (HH:MM:SS)"),
    risk_profile: str = Query("balanced", description="Risk profile: conservative, balanced, or aggressive"),
    base_demand_mw: Optional[float] = Query(None, description="Custom average base demand in MW")
) -> SimulationResponse:
    try:
        result = simulate_day_ahead_procurement(
            target_date=target_date,
            cutoff_time_str=cutoff_time,
            risk_profile=risk_profile,
            base_demand_mw=base_demand_mw
        )
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return SimulationResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {e}")

@router.get("/evaluate-risk", response_model=RiskEvaluationResponse)
def evaluate_risk(
    target_date: str = Query("2026-01-15", description="Target delivery date (YYYY-MM-DD)"),
    cutoff_time: str = Query(settings.default_decision_time_utc, description="Decision cutoff time in UTC (HH:MM:SS)")
) -> RiskEvaluationResponse:
    try:
        result = evaluate_decision_model(target_date=target_date, cutoff_time_str=cutoff_time)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return RiskEvaluationResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk evaluation error: {e}")
