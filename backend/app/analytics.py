import math
import sqlite3
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from app.config import settings
from app.db import get_db

def calculate_metrics(actuals: List[float], forecasts: List[float]) -> Dict[str, Any]:
    if not actuals or not forecasts or len(actuals) != len(forecasts):
        return {
            "count": 0,
            "mae": 0.0,
            "rmse": 0.0,
            "mean_bias": 0.0,
            "wape": 0.0,
            "bias_direction": "Neutral",
            "max_overforecast": 0.0,
            "max_underforecast": 0.0,
            "total_actual_mwh": 0.0,
            "total_forecast_mwh": 0.0
        }

    n = len(actuals)
    errors = [f - a for f, a in zip(forecasts, actuals)]
    abs_errors = [abs(e) for e in errors]
    squared_errors = [e ** 2 for e in errors]

    sum_actual = sum(actuals)
    sum_forecast = sum(forecasts)
    sum_abs_error = sum(abs_errors)

    mae = sum_abs_error / n
    rmse = math.sqrt(sum(squared_errors) / n)
    mean_bias = sum(errors) / n
    wape = (sum_abs_error / sum_actual * 100.0) if sum_actual > 0 else 0.0

    if mean_bias > 50.0:
        bias_direction = "Over-forecast"
    elif mean_bias < -50.0:
        bias_direction = "Under-forecast"
    else:
        bias_direction = "Neutral"

    # Half-hour resolution: MWh = MW * 0.5 hours
    total_actual_mwh = sum_actual * 0.5
    total_forecast_mwh = sum_forecast * 0.5

    return {
        "count": n,
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mean_bias": round(mean_bias, 2),
        "wape": round(wape, 2),
        "bias_direction": bias_direction,
        "max_overforecast": round(max(errors), 2),
        "max_underforecast": round(min(errors), 2),
        "total_actual_mwh": round(total_actual_mwh, 2),
        "total_forecast_mwh": round(total_forecast_mwh, 2)
    }

def get_day_ahead_cutoff(delivery_date_str: str, cutoff_time_str: str = settings.default_decision_time_utc) -> str:
    del_dt = datetime.strptime(delivery_date_str, "%Y-%m-%d")
    dec_dt = del_dt - timedelta(days=1)
    return f"{dec_dt.strftime('%Y-%m-%d')}T{cutoff_time_str}Z"

def get_daily_settlement_data(
    target_date: str,
    cutoff_time_str: str = settings.default_decision_time_utc
) -> List[Dict[str, Any]]:
    cutoff_iso = get_day_ahead_cutoff(target_date, cutoff_time_str)
    
    query = """
        WITH latest_forecast AS (
            SELECT 
                start_time,
                generation AS forecasted_mw,
                publish_time,
                ROW_NUMBER() OVER (
                    PARTITION BY start_time 
                    ORDER BY publish_time DESC
                ) as rn
            FROM forecast_generation
            WHERE settlement_date = ?
              AND publish_time <= ?
        )
        SELECT 
            a.settlement_date,
            a.settlement_period,
            a.start_time,
            a.generation AS actual_mw,
            COALESCE(f.forecasted_mw, a.generation) AS forecasted_mw,
            f.publish_time,
            (COALESCE(f.forecasted_mw, a.generation) - a.generation) AS forecast_error
        FROM actual_generation a
        LEFT JOIN latest_forecast f 
          ON substr(a.start_time, 1, 13) || ':00:00Z' = f.start_time 
         AND f.rn = 1
        WHERE a.settlement_date = ?
        ORDER BY a.settlement_period ASC
    """
    
    with get_db() as conn:
        rows = conn.execute(query, (target_date, cutoff_iso, target_date)).fetchall()

    result = []
    for r in rows:
        result.append({
            "settlement_date": r["settlement_date"],
            "settlement_period": int(r["settlement_period"]),
            "start_time": r["start_time"],
            "actual_mw": round(float(r["actual_mw"]), 1),
            "forecasted_mw": round(float(r["forecasted_mw"]), 1),
            "publish_time": r["publish_time"],
            "forecast_error": round(float(r["forecast_error"]), 1)
        })
    return result

def get_monthly_summary(
    start_date: str = "2026-01-01",
    end_date: str = "2026-01-31",
    cutoff_time_str: str = settings.default_decision_time_utc
) -> Dict[str, Any]:
    with get_db() as conn:
        dates_rows = conn.execute(
            "SELECT DISTINCT settlement_date FROM actual_generation WHERE settlement_date BETWEEN ? AND ? ORDER BY settlement_date",
            (start_date, end_date)
        ).fetchall()
        dates = [r[0] for r in dates_rows]

    all_actuals: List[float] = []
    all_forecasts: List[float] = []
    daily_breakdown: List[Dict[str, Any]] = []

    # Settlement period buckets (1 to 48)
    sp_data: Dict[int, Dict[str, List[float]]] = {
        i: {"actuals": [], "forecasts": [], "errors": []} for i in range(1, 49)
    }

    for d in dates:
        day_rows = get_daily_settlement_data(d, cutoff_time_str)
        day_actuals = [r["actual_mw"] for r in day_rows]
        day_forecasts = [r["forecasted_mw"] for r in day_rows]
        
        all_actuals.extend(day_actuals)
        all_forecasts.extend(day_forecasts)

        for r in day_rows:
            sp = r["settlement_period"]
            sp_data[sp]["actuals"].append(r["actual_mw"])
            sp_data[sp]["forecasts"].append(r["forecasted_mw"])
            sp_data[sp]["errors"].append(r["forecast_error"])

        day_metrics = calculate_metrics(day_actuals, day_forecasts)
        daily_breakdown.append({
            "date": d,
            "metrics": day_metrics,
            "peak_actual_mw": max(day_actuals) if day_actuals else 0.0,
            "peak_forecast_mw": max(day_forecasts) if day_forecasts else 0.0
        })

    aggregate_metrics = calculate_metrics(all_actuals, all_forecasts)

    # Compute settlement period profile
    sp_profile = []
    for sp in range(1, 49):
        acts = sp_data[sp]["actuals"]
        fcs = sp_data[sp]["forecasts"]
        errs = sp_data[sp]["errors"]
        n_sp = len(acts)
        if n_sp > 0:
            avg_act = sum(acts) / n_sp
            avg_fc = sum(fcs) / n_sp
            avg_err = sum(errs) / n_sp
            mae_sp = sum(abs(e) for e in errs) / n_sp
            rmse_sp = math.sqrt(sum(e ** 2 for e in errs) / n_sp)
        else:
            avg_act = avg_fc = avg_err = mae_sp = rmse_sp = 0.0

        sp_profile.append({
            "settlement_period": sp,
            "avg_actual_mw": round(avg_act, 1),
            "avg_forecast_mw": round(avg_fc, 1),
            "avg_error_mw": round(avg_err, 1),
            "mae_mw": round(mae_sp, 1),
            "rmse_mw": round(rmse_sp, 1),
            "is_evening_peak": 33 <= sp <= 38,
            "is_night_offpeak": 1 <= sp <= 14
        })

    # Peak vs Off-Peak aggregations
    peak_errs = [e for sp in range(33, 39) for e in sp_data[sp]["errors"]]
    offpeak_errs = [e for sp in range(1, 15) for e in sp_data[sp]["errors"]]

    peak_mae = (sum(abs(e) for e in peak_errs) / len(peak_errs)) if peak_errs else 0.0
    peak_bias = (sum(peak_errs) / len(peak_errs)) if peak_errs else 0.0
    offpeak_mae = (sum(abs(e) for e in offpeak_errs) / len(offpeak_errs)) if offpeak_errs else 0.0
    offpeak_bias = (sum(offpeak_errs) / len(offpeak_errs)) if offpeak_errs else 0.0

    return {
        "period": {"start_date": start_date, "end_date": end_date, "total_days": len(dates)},
        "decision_cutoff_utc": cutoff_time_str,
        "aggregate_metrics": aggregate_metrics,
        "time_of_day_analysis": {
            "evening_peak": {
                "period_description": "SPs 33-38 (16:00 to 19:00 UTC)",
                "mae_mw": round(peak_mae, 1),
                "bias_mw": round(peak_bias, 1)
            },
            "night_offpeak": {
                "period_description": "SPs 1-14 (00:00 to 07:00 UTC)",
                "mae_mw": round(offpeak_mae, 1),
                "bias_mw": round(offpeak_bias, 1)
            }
        },
        "settlement_period_profile": sp_profile,
        "daily_breakdown": daily_breakdown
    }
