from fastapi import APIRouter
from app.config import settings
from app.db import get_db
from app.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    try:
        with get_db() as conn:
            actual_count = conn.execute("SELECT count(*) FROM actual_generation").fetchone()[0]
            forecast_count = conn.execute("SELECT count(*) FROM forecast_generation").fetchone()[0]
            return HealthResponse(
                status="healthy",
                database="connected",
                actual_records=actual_count,
                forecast_records=forecast_count
            )
    except Exception as e:
        return HealthResponse(
            status="degraded",
            database=str(e),
            actual_records=0,
            forecast_records=0
        )
