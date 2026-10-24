import {
  DailyResponse,
  HealthResponse,
  MonthlyResponse,
  RiskEvaluationResponse,
  SimulationResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Healthcheck failed: ${res.statusText}`);
  return res.json();
}

export async function fetchMonthlyAnalytics(
  startDate = '2026-01-01',
  endDate = '2026-01-31',
  cutoffTime = '11:00:00'
): Promise<MonthlyResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    cutoff_time: cutoffTime,
  });
  const res = await fetch(`${API_BASE}/analytics/monthly?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch monthly analytics: ${res.statusText}`);
  return res.json();
}

export async function fetchDailyAnalytics(
  date: string,
  cutoffTime = '11:00:00'
): Promise<DailyResponse> {
  const params = new URLSearchParams({
    date,
    cutoff_time: cutoffTime,
  });
  const res = await fetch(`${API_BASE}/analytics/daily?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch daily analytics for ${date}: ${res.statusText}`);
  return res.json();
}

export async function fetchSimulation(
  targetDate: string,
  cutoffTime = '11:00:00',
  riskProfile = 'balanced',
  baseDemandMw?: number
): Promise<SimulationResponse> {
  const params = new URLSearchParams({
    target_date: targetDate,
    cutoff_time: cutoffTime,
    risk_profile: riskProfile,
  });
  if (baseDemandMw !== undefined) {
    params.append('base_demand_mw', baseDemandMw.toString());
  }
  const res = await fetch(`${API_BASE}/decision/simulate?${params.toString()}`);
  if (!res.ok) throw new Error(`Simulation failed: ${res.statusText}`);
  return res.json();
}

export async function fetchRiskEvaluation(
  targetDate: string,
  cutoffTime = '11:00:00'
): Promise<RiskEvaluationResponse> {
  const params = new URLSearchParams({
    target_date: targetDate,
    cutoff_time: cutoffTime,
  });
  const res = await fetch(`${API_BASE}/decision/evaluate-risk?${params.toString()}`);
  if (!res.ok) throw new Error(`Risk evaluation failed: ${res.statusText}`);
  return res.json();
}
