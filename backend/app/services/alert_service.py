from __future__ import annotations

from typing import Any


def _to_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def check_alerts(sensor_data: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Evaluates incoming IoT readings against safety thresholds.
    Returns a list of alert dictionaries with type, value, and message.
    """
    alerts: list[dict[str, Any]] = []

    aqi = _to_float(sensor_data.get("aqi"))
    noise_db = _to_float(sensor_data.get("noise_db"))
    water_ph = _to_float(sensor_data.get("water_ph"))
    if water_ph is None:
        water_ph = _to_float(sensor_data.get("ph"))

    if aqi is not None and aqi > 150:
        alerts.append(
            {
                "type": "AQI",
                "value": aqi,
                "message": "AQI exceeded safe threshold (150)",
            }
        )

    if water_ph is not None and (water_ph < 6.5 or water_ph > 7.5):
        alerts.append(
            {
                "type": "Water pH",
                "value": water_ph,
                "message": "Water pH outside safe range (6.5-7.5)",
            }
        )

    if noise_db is not None and noise_db > 45:
        alerts.append(
            {
                "type": "Noise",
                "value": noise_db,
                "message": "Noise level exceeded safe limit (45 dB)",
            }
        )

    return alerts