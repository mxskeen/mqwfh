from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["actual_records"] > 0

def test_monthly_analytics_endpoint():
    response = client.get("/api/analytics/monthly?start_date=2026-01-01&end_date=2026-01-07")
    assert response.status_code == 200
    data = response.json()
    assert "aggregate_metrics" in data
    assert "daily_breakdown" in data
    assert len(data["daily_breakdown"]) == 7
    assert len(data["settlement_period_profile"]) == 48

def test_daily_analytics_endpoint():
    response = client.get("/api/analytics/daily?date=2026-01-15&cutoff_time=11:00:00")
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2026-01-15"
    assert len(data["settlement_data"]) == 48
    assert data["metrics"]["mae"] > 0.0

def test_decision_simulation_endpoint():
    response = client.get("/api/decision/simulate?target_date=2026-01-15&risk_profile=conservative")
    assert response.status_code == 200
    data = response.json()
    assert data["target_date"] == "2026-01-15"
    assert data["risk_profile"] == "conservative"
    assert len(data["hourly_schedule"]) == 48
    assert data["totals"]["total_recommended_procurement_mwh"] > 0

def test_decision_evaluate_risk_endpoint():
    response = client.get("/api/decision/evaluate-risk?target_date=2026-01-15")
    assert response.status_code == 200
    data = response.json()
    assert "risk_level" in data
    assert data["risk_level"] in ["HIGH", "MODERATE", "LOW"]
    assert "probability_shortfall_risk" in data
