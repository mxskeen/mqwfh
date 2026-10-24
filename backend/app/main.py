import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.config import settings
from app.db import init_db, get_db
from app.routes.analytics import router as analytics_router
from app.routes.decision import router as decision_router
from app.routes.health import router as health_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Initializing UK Wind Power Trading Backend")
    init_db()
    
    with get_db() as conn:
        actuals = conn.execute("SELECT count(*) FROM actual_generation").fetchone()[0]
        forecasts = conn.execute("SELECT count(*) FROM forecast_generation").fetchone()[0]
        logger.info(f"Connected to database: {actuals} actuals, {forecasts} forecasts available")

        if actuals == 0:
            logger.info("Database is empty. Running initial Elexon January 2026 ingestion pipeline...")
            from app.ingest import run_pipeline
            run_pipeline()
            actuals = conn.execute("SELECT count(*) FROM actual_generation").fetchone()[0]
            forecasts = conn.execute("SELECT count(*) FROM forecast_generation").fetchone()[0]
            logger.info(f"Ingestion complete: {actuals} actuals, {forecasts} forecasts available")

    yield
    logger.info("Shutting down backend server")

app = FastAPI(
    title="UK Wind Power Day-Ahead Trading Desk API",
    description="Quantitative forecast accuracy evaluation and day-ahead procurement decision engine for UK energy utilities.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(health_router)
app.include_router(analytics_router)
app.include_router(decision_router)

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")
