import pytest
from app.analytics import calculate_metrics, get_day_ahead_cutoff, get_daily_settlement_data
from app.decision_engine import simulate_day_ahead_procurement, evaluate_decision_model

def test_calculate_metrics_empty():
    res = calculate_metrics([], [])
    assert res["count"] == 0
    assert res["mae"] == 0.0
    assert res["rmse"] == 0.0
    assert res["mean_bias"] == 0.0

def test_calculate_metrics_perfect():
    actuals = [100.0, 200.0, 300.0]
    forecasts = [100.0, 200.0, 300.0]
    res = calculate_metrics(actuals, forecasts)
    assert res["count"] == 3
    assert res["mae"] == 0.0
    assert res["rmse"] == 0.0
    assert res["mean_bias"] == 0.0
    assert res["wape"] == 0.0
    assert res["bias_direction"] == "Neutral"

def test_calculate_metrics_known_values():
    actuals = [1000.0, 2000.0]
    forecasts = [1200.0, 2400.0]  # Errors: +200, +400
    res = calculate_metrics(actuals, forecasts)
    assert res["count"] == 2
    assert res["mae"] == 300.0
    # RMSE: sqrt((200^2 + 400^2)/2) = sqrt(100000) = 316.23
    assert res["rmse"] == 316.23
    assert res["mean_bias"] == 300.0
    # WAPE: (200 + 400) / (1000 + 2000) * 100 = 600 / 3000 * 100 = 20.0%
    assert res["wape"] == 20.0
    assert res["bias_direction"] == "Over-forecast"

def test_get_day_ahead_cutoff():
    cutoff = get_day_ahead_cutoff("2026-01-15", "11:00:00")
    assert cutoff == "2026-01-14T11:00:00Z"

    cutoff_month_start = get_day_ahead_cutoff("2026-01-01", "12:00:00")
    assert cutoff_month_start == "2025-12-31T12:00:00Z"

def test_daily_settlement_data_integrity():
    rows = get_daily_settlement_data("2026-01-15", "11:00:00")
    assert len(rows) == 48
    assert rows[0]["settlement_period"] == 1
    assert rows[-1]["settlement_period"] == 48
    for r in rows:
        assert "actual_mw" in r
        assert "forecasted_mw" in r
        assert "forecast_error" in r
        assert r["actual_mw"] >= 0.0
        assert r["forecasted_mw"] >= 0.0

def test_procurement_simulation():
    res = simulate_day_ahead_procurement("2026-01-15", "11:00:00", "balanced")
    assert "hourly_schedule" in res
    assert len(res["hourly_schedule"]) == 48
    assert res["totals"]["total_demand_mwh"] > 0
    assert res["totals"]["total_recommended_procurement_mwh"] >= res["totals"]["total_raw_procurement_mwh"]

def test_decision_model_evaluation():
    res = evaluate_decision_model("2026-01-15", "11:00:00")
    assert "risk_level" in res
    assert res["risk_level"] in ["HIGH", "MODERATE", "LOW"]
    assert "probability_shortfall_risk" in res
    assert 0.0 <= res["probability_shortfall_risk"] <= 1.0
