from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.analytics import (
    calculate_metrics,
    get_daily_settlement_data,
    get_monthly_summary
)
from app.config import settings
from app.schemas import DailyResponse, MetricKPIs, MonthlyResponse

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/monthly", response_model=MonthlyResponse)
def get_monthly(
    start_date: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    cutoff_time: str = Query(settings.default_decision_time_utc, description="Decision cutoff time in UTC (HH:MM:SS)")
) -> MonthlyResponse:
    try:
        data = get_monthly_summary(start_date, end_date, cutoff_time)
        return MonthlyResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate monthly metrics: {e}")

@router.get("/daily", response_model=DailyResponse)
def get_daily(
    date: str = Query("2026-01-15", description="Target delivery date (YYYY-MM-DD)"),
    cutoff_time: str = Query(settings.default_decision_time_utc, description="Decision cutoff time in UTC (HH:MM:SS)")
) -> DailyResponse:
    try:
        rows = get_daily_settlement_data(date, cutoff_time)
        if not rows:
            raise HTTPException(status_code=404, detail=f"No settlement data found for {date}")

        actuals = [r["actual_mw"] for r in rows]
        forecasts = [r["forecasted_mw"] for r in rows]
        metrics = calculate_metrics(actuals, forecasts)

        return DailyResponse(
            date=date,
            cutoff_time_utc=cutoff_time,
            metrics=MetricKPIs(**metrics),
            settlement_data=rows
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch daily settlement data: {e}")
