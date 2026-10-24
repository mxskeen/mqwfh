import json
import logging
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from app.config import settings

logger = logging.getLogger(__name__)

def parse_settlement_period(start_time_iso: str) -> Tuple[str, int]:
    dt = datetime.fromisoformat(start_time_iso.replace("Z", "+00:00"))
    settlement_date = dt.strftime("%Y-%m-%d")
    settlement_period = dt.hour * 2 + (1 if dt.minute < 30 else 2)
    return settlement_date, settlement_period

def fetch_json_stream(url: str, params: Dict[str, str], max_retries: int = 3, timeout: int = 30) -> List[Dict[str, Any]]:
    query_str = "&".join(f"{k}={v}" for k, v in params.items())
    full_url = f"{url}?{query_str}"
    
    for attempt in range(1, max_retries + 1):
        try:
            req = urllib.request.Request(full_url, headers={"User-Agent": "REint-PowerDesk/1.0"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                if resp.status == 200:
                    data = resp.read().decode("utf-8")
                    return json.loads(data)
                logger.warning(f"Unexpected status {resp.status} for {full_url}")
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            logger.warning(f"Attempt {attempt}/{max_retries} failed for {full_url}: {e}")
            if attempt == max_retries:
                raise
            time.sleep(2 * attempt)
    return []

def fetch_actuals_chunk(date_from_iso: str, date_to_iso: str) -> List[Dict[str, Any]]:
    params = {
        "publishDateTimeFrom": date_from_iso,
        "publishDateTimeTo": date_to_iso
    }
    raw_items = fetch_json_stream(settings.fuelhh_stream_url, params)
    wind_items = []
    for item in raw_items:
        if item.get("fuelType") == "WIND":
            sdate, sp = parse_settlement_period(item["startTime"])
            wind_items.append({
                "startTime": item["startTime"],
                "settlementDate": item.get("settlementDate", sdate),
                "settlementPeriod": int(item.get("settlementPeriod", sp)),
                "fuelType": "WIND",
                "generation": float(item.get("generation", 0.0)),
                "publishTime": item.get("publishTime")
            })
    return wind_items

def fetch_forecasts_chunk(date_from_iso: str, date_to_iso: str) -> List[Dict[str, Any]]:
    params = {
        "publishDateTimeFrom": date_from_iso,
        "publishDateTimeTo": date_to_iso
    }
    raw_items = fetch_json_stream(settings.windfor_stream_url, params)
    forecast_items = []
    for item in raw_items:
        sdate, sp = parse_settlement_period(item["startTime"])
        forecast_items.append({
            "publishTime": item["publishTime"],
            "startTime": item["startTime"],
            "settlementDate": sdate,
            "settlementPeriod": sp,
            "generation": float(item.get("generation", 0.0))
        })
    return forecast_items
