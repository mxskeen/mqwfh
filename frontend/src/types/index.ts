export interface MetricKPIs {
  count: number;
  mae: number;
  rmse: number;
  mean_bias: number;
  wape: number;
  bias_direction: 'Over-forecast' | 'Under-forecast' | 'Neutral';
  max_overforecast: number;
  max_underforecast: number;
  total_actual_mwh: number;
  total_forecast_mwh: number;
}

export interface DailySettlementItem {
  settlement_date: string;
  settlement_period: number;
  start_time: string;
  actual_mw: number;
  forecasted_mw: number;
  publish_time: string | null;
  forecast_error: number;
}

export interface DailyResponse {
  date: string;
  cutoff_time_utc: string;
  metrics: MetricKPIs;
  settlement_data: DailySettlementItem[];
}

export interface SettlementPeriodProfileItem {
  settlement_period: number;
  avg_actual_mw: number;
  avg_forecast_mw: number;
  avg_error_mw: number;
  mae_mw: number;
  rmse_mw: number;
  is_evening_peak: boolean;
  is_night_offpeak: boolean;
}

export interface TimeOfDayMetric {
  period_description: string;
  mae_mw: number;
  bias_mw: number;
}

export interface TimeOfDayAnalysis {
  evening_peak: TimeOfDayMetric;
  night_offpeak: TimeOfDayMetric;
}

export interface DailyBreakdownItem {
  date: string;
  metrics: MetricKPIs;
  peak_actual_mw: number;
  peak_forecast_mw: number;
}

export interface MonthlyResponse {
  period: {
    start_date: string;
    end_date: string;
    total_days: number;
  };
  decision_cutoff_utc: string;
  aggregate_metrics: MetricKPIs;
  time_of_day_analysis: TimeOfDayAnalysis;
  settlement_period_profile: SettlementPeriodProfileItem[];
  daily_breakdown: DailyBreakdownItem[];
}

export interface SimulationScheduleItem {
  settlement_period: number;
  start_time: string;
  demand_mw: number;
  forecast_wind_mw: number;
  actual_wind_mw: number;
  raw_procurement_mw: number;
  safety_buffer_mw: number;
  recommended_procurement_mw: number;
  unbuffered_shortfall_risk_mw: number;
  buffered_shortfall_risk_mw: number;
}

export interface SimulationTotals {
  total_demand_mwh: number;
  total_wind_forecast_mwh: number;
  total_raw_procurement_mwh: number;
  total_recommended_procurement_mwh: number;
  reserve_buffer_energy_mwh: number;
}

export interface SimulationResponse {
  target_date: string;
  decision_cutoff_utc: string;
  risk_profile: 'conservative' | 'balanced' | 'aggressive';
  metrics: MetricKPIs;
  totals: SimulationTotals;
  hourly_schedule: SimulationScheduleItem[];
}

export interface RiskEvaluationResponse {
  provider: string;
  state: Record<string, unknown>;
  risk_level: 'HIGH' | 'MODERATE' | 'LOW';
  hedge_buffer_recommended: boolean;
  probability_shortfall_risk: number;
  confidence_score: number;
  recommended_buffer_mw: number;
  risk_factors: string[];
}

export interface HealthResponse {
  status: string;
  database: string;
  actual_records: number;
  forecast_records: number;
}
