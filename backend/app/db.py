import sqlite3
from contextlib import contextmanager
from typing import Generator
from app.config import settings

def init_db(db_path: str = settings.db_path) -> None:
    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA synchronous = NORMAL")
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS actual_generation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time TEXT NOT NULL UNIQUE,
                settlement_date TEXT NOT NULL,
                settlement_period INTEGER NOT NULL,
                fuel_type TEXT NOT NULL DEFAULT 'WIND',
                generation REAL NOT NULL,
                publish_time TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS forecast_generation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                publish_time TEXT NOT NULL,
                start_time TEXT NOT NULL,
                settlement_date TEXT NOT NULL,
                settlement_period INTEGER NOT NULL,
                generation REAL NOT NULL,
                UNIQUE(publish_time, start_time)
            )
        """)

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_actual_date_sp ON actual_generation(settlement_date, settlement_period)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_actual_start ON actual_generation(start_time)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecast_start ON forecast_generation(start_time)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecast_date_sp ON forecast_generation(settlement_date, settlement_period)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecast_publish ON forecast_generation(publish_time)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecast_lookup ON forecast_generation(start_time, publish_time)")

        conn.commit()

@contextmanager
def get_db(db_path: str = settings.db_path) -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
