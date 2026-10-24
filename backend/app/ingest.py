import logging
import sys
from datetime import datetime, timedelta
from app.config import DB_PATH
from app.db import init_db, get_db
from app.elexon_client import fetch_actuals_chunk, fetch_forecasts_chunk

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingest")

def ingest_actuals(start_dt: datetime, end_dt: datetime, step_days: int = 4) -> int:
    total_saved = 0
    curr = start_dt
    while curr < end_dt:
        chunk_end = min(curr + timedelta(days=step_days), end_dt)
        from_iso = curr.strftime("%Y-%m-%dT%H:%M:%SZ")
        to_iso = chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ")
        logger.info(f"Fetching FUELHH wind actuals: {from_iso} to {to_iso}")
        
        items = fetch_actuals_chunk(from_iso, to_iso)
        if items:
            with get_db() as conn:
                conn.executemany("""
                    INSERT OR REPLACE INTO actual_generation 
                    (start_time, settlement_date, settlement_period, fuel_type, generation, publish_time)
                    VALUES (:startTime, :settlementDate, :settlementPeriod, :fuelType, :generation, :publishTime)
                """, items)
                conn.commit()
            total_saved += len(items)
        curr = chunk_end
    return total_saved

def ingest_forecasts(start_dt: datetime, end_dt: datetime, step_days: int = 3) -> int:
    total_saved = 0
    curr = start_dt
    while curr < end_dt:
        chunk_end = min(curr + timedelta(days=step_days), end_dt)
        from_iso = curr.strftime("%Y-%m-%dT%H:%M:%SZ")
        to_iso = chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ")
        logger.info(f"Fetching WINDFOR forecasts: {from_iso} to {to_iso}")
        
        items = fetch_forecasts_chunk(from_iso, to_iso)
        if items:
            with get_db() as conn:
                conn.executemany("""
                    INSERT OR REPLACE INTO forecast_generation
                    (publish_time, start_time, settlement_date, settlement_period, generation)
                    VALUES (:publishTime, :startTime, :settlementDate, :settlementPeriod, :generation)
                """, items)
                conn.commit()
            total_saved += len(items)
        curr = chunk_end
    return total_saved

def run_pipeline() -> None:
    logger.info("Initializing SQLite database")
    init_db()

    actuals_start = datetime(2026, 1, 1, 0, 0, 0)
    actuals_end = datetime(2026, 2, 2, 0, 0, 0)
    logger.info(f"Starting actuals ingestion: {actuals_start} to {actuals_end}")
    actuals_count = ingest_actuals(actuals_start, actuals_end, step_days=4)
    logger.info(f"Saved {actuals_count} actual wind records")

    forecasts_start = datetime(2025, 12, 30, 0, 0, 0)
    forecasts_end = datetime(2026, 2, 2, 0, 0, 0)
    logger.info(f"Starting forecasts ingestion: {forecasts_start} to {forecasts_end}")
    forecasts_count = ingest_forecasts(forecasts_start, forecasts_end, step_days=3)
    logger.info(f"Saved {forecasts_count} forecast records")

    with get_db() as conn:
        actual_total = conn.execute("SELECT count(*) FROM actual_generation").fetchone()[0]
        forecast_total = conn.execute("SELECT count(*) FROM forecast_generation").fetchone()[0]
        actual_range = conn.execute("SELECT min(settlement_date), max(settlement_date) FROM actual_generation").fetchone()
        logger.info(f"DB verification: {actual_total} actuals ({actual_range[0]} to {actual_range[1]}), {forecast_total} forecasts")

if __name__ == "__main__":
    run_pipeline()
