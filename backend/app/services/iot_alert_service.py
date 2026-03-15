from __future__ import annotations

from datetime import datetime, time
from typing import Any


def _to_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def check_environmental_alerts(data: dict[str, Any]) -> list[dict[str, Any]]:
    # Evaluates incoming IoT payload against compliance rules.
    alerts: list[dict[str, Any]] = []

    location_id_raw = data.get("location_id", 0)
    try:
        location_id = int(location_id_raw)
    except (TypeError, ValueError):
        location_id = 0

    noise_db = _to_float(data.get("noise_db"))
    ph_value = _to_float(data.get("ph"))
    if ph_value is None:
        ph_value = _to_float(data.get("water_ph"))

    # Rule 1: Night-time noise compliance (after 21:00).
    current_time = datetime.now().time()
    if noise_db is not None and current_time >= time(21, 0) and noise_db > 45:
        alerts.append(
            {
                "location_id": location_id,
                "parameter": "noise",
                "value": noise_db,
                "threshold": 45.0,
                "message": "Night noise limit exceeded",
            }
        )

    # Rule 2: Water pH compliance range (6.5 to 7.5).
    if ph_value is not None and ph_value < 6.5:
        alerts.append(
            {
                "location_id": location_id,
                "parameter": "ph",
                "value": ph_value,
                "threshold": 6.5,
                "message": "Water too acidic",
            }
        )
    elif ph_value is not None and ph_value > 7.5:
        alerts.append(
            {
                "location_id": location_id,
                "parameter": "ph",
                "value": ph_value,
                "threshold": 7.5,
                "message": "Water too alkaline",
            }
        )

    return alerts
