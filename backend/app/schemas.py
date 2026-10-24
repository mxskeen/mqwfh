from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    database: str
    actual_records: int
    forecast_records: int

class MetricKPIs(BaseModel):
    count: int
    mae: float
    rmse: float
    mean_bias: float
    wape: float
    bias_direction: str
    max_overforecast: float
    max_underforecast: float
    total_actual_mwh: float
    total_forecast_mwh: float

class DailySettlementItem(BaseModel):
    settlement_date: str
    settlement_period: int
    start_time: str
    actual_mw: float
    forecasted_mw: float
    publish_time: Optional[str] = None
    forecast_error: float

class DailyResponse(BaseModel):
    date: str
    cutoff_time_utc: str
    metrics: MetricKPIs
    settlement_data: List[DailySettlementItem]

class SettlementPeriodProfileItem(BaseModel):
    settlement_period: int
    avg_actual_mw: float
    avg_forecast_mw: float
    avg_error_mw: float
    mae_mw: float
    rmse_mw: float
    is_evening_peak: bool
    is_night_offpeak: bool

class TimeOfDayMetric(BaseModel):
    period_description: str
    mae_mw: float
    bias_mw: float

class TimeOfDayAnalysis(BaseModel):
    evening_peak: TimeOfDayMetric
    night_offpeak: TimeOfDayMetric

class DailyBreakdownItem(BaseModel):
    date: str
    metrics: MetricKPIs
    peak_actual_mw: float
    peak_forecast_mw: float

class MonthlyResponse(BaseModel):
    period: Dict[str, Any]
    decision_cutoff_utc: str
    aggregate_metrics: MetricKPIs
    time_of_day_analysis: TimeOfDayAnalysis
    settlement_period_profile: List[SettlementPeriodProfileItem]
    daily_breakdown: List[DailyBreakdownItem]

class SimulationScheduleItem(BaseModel):
    settlement_period: int
    start_time: str
    demand_mw: float
    forecast_wind_mw: float
    actual_wind_mw: float
    raw_procurement_mw: float
    safety_buffer_mw: float
    recommended_procurement_mw: float
    unbuffered_shortfall_risk_mw: float
    buffered_shortfall_risk_mw: float

class SimulationTotals(BaseModel):
    total_demand_mwh: float
    total_wind_forecast_mwh: float
    total_raw_procurement_mwh: float
    total_recommended_procurement_mwh: float
    reserve_buffer_energy_mwh: float

class SimulationResponse(BaseModel):
    target_date: str
    decision_cutoff_utc: str
    risk_profile: str
    metrics: MetricKPIs
    totals: SimulationTotals
    hourly_schedule: List[SimulationScheduleItem]

class RiskEvaluationResponse(BaseModel):
    provider: str
    state: Dict[str, Any]
    risk_level: str
    hedge_buffer_recommended: bool
    probability_shortfall_risk: float
    confidence_score: float
    recommended_buffer_mw: float
    risk_factors: List[str]
