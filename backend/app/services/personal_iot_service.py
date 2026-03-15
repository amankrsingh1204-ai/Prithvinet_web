from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _parse_float(value: Any) -> float:
    try:
        return float(str(value).strip())
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Non-numeric Blynk response: {value}") from exc


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def _get_virtual_pin_value(token: str, pin: str) -> float:
    pin_key = str(pin or "").strip().lower()
    if not pin_key.startswith("v"):
        pin_key = f"v{pin_key}"

    url = f"https://blynk.cloud/external/api/get?token={token}&{pin_key}"
    with httpx.Client(timeout=10.0) as client:
        response = client.get(url)
        response.raise_for_status()
        return _parse_float(response.text)


def _build_alerts(aqi: float, noise_db: float, water_ph: float) -> list[dict[str, str]]:
    alerts: list[dict[str, str]] = []

    if aqi > 200:
        alerts.append(
            {
                "type": "AQI",
                "severity": "High",
                "message": "Air quality is in high-risk zone. Sensitive groups should limit exposure.",
            }
        )
    elif aqi > 120:
        alerts.append(
            {
                "type": "AQI",
                "severity": "Moderate",
                "message": "Air quality is elevated. Prolonged outdoor activity should be reduced.",
            }
        )

    if noise_db > 85:
        alerts.append(
            {
                "type": "Noise",
                "severity": "High",
                "message": "Noise exceeds safe daily threshold and may increase stress and sleep disruption.",
            }
        )
    elif noise_db > 70:
        alerts.append(
            {
                "type": "Noise",
                "severity": "Moderate",
                "message": "Noise is above comfort range. Consider mitigation in personal area.",
            }
        )

    if water_ph < 6.5 or water_ph > 7.5:
        alerts.append(
            {
                "type": "Water pH",
                "severity": "High",
                "message": "Water pH is outside safe range (6.5-7.5) and may indicate treatment imbalance.",
            }
        )

    return alerts


def _life_expectancy_impact(aqi: float, noise_db: float, water_ph: float) -> dict[str, Any]:
    ph_penalty = 0.0
    if water_ph < 6.5 or water_ph > 8.5:
        ph_penalty = 4.0
    elif water_ph < 6.8 or water_ph > 8.2:
        ph_penalty = 2.0

    months_loss = max(
        0,
        round(
            (max(0.0, aqi - 50.0) * 0.085)
            + (max(0.0, noise_db - 55.0) * 0.18)
            + ph_penalty,
        ),
    )

    baseline_years = 72.0
    projected_years = round(max(58.0, baseline_years - months_loss / 12.0), 1)
    severity = "Low"
    if months_loss >= 10:
        severity = "High"
    elif months_loss >= 5:
        severity = "Moderate"

    return {
        "months_pressure": months_loss,
        "projected_years": projected_years,
        "severity": severity,
        "summary": f"Estimated life expectancy pressure is {months_loss} months if current exposure trend persists.",
    }


def _health_impacts(aqi: float, noise_db: float, water_ph: float) -> dict[str, Any]:
    def score(value: float, low: float, high: float) -> int:
        if value <= low:
            return 20
        if value >= high:
            return 95
        return int(round(20 + ((value - low) / (high - low)) * 75))

    respiratory = min(100, int(round(score(aqi, 60, 240) * 0.72 + score(noise_db, 55, 95) * 0.28)))
    cardiovascular = min(100, int(round(score(aqi, 70, 260) * 0.62 + score(noise_db, 55, 95) * 0.38)))
    stress_sleep = score(noise_db, 50, 95)
    waterborne = score(abs(water_ph - 7.0), 0.2, 2.0)

    highest = max(respiratory, cardiovascular, stress_sleep, waterborne)
    band = "Low"
    if highest >= 80:
        band = "High"
    elif highest >= 55:
        band = "Moderate"

    return {
        "overall_band": band,
        "factors": [
            {"name": "Respiratory", "score": respiratory},
            {"name": "Cardiovascular", "score": cardiovascular},
            {"name": "Stress / Sleep", "score": stress_sleep},
            {"name": "Water-borne", "score": waterborne},
        ],
    }


def build_personal_iot_payload(config: dict[str, Any]) -> dict[str, Any]:
    token = str(config.get("auth_token") or "").strip()
    if not token:
        raise ValueError("Blynk auth token is missing in iot_blynk_configs")

    pin_map = config.get("pin_map") or {}
    if not isinstance(pin_map, dict):
        pin_map = {}

    temp_pin = str(pin_map.get("temperature") or "v0")
    humidity_pin = str(pin_map.get("humidity") or "v1")
    noise_pin = str(pin_map.get("noise_db") or "v2")
    ph_pin = str(pin_map.get("water_ph") or "v3")
    gas_pin = str(pin_map.get("gas_ppm") or "v4")

    temperature = _get_virtual_pin_value(token, temp_pin)
    humidity = _get_virtual_pin_value(token, humidity_pin)
    noise_db = _get_virtual_pin_value(token, noise_pin)
    water_ph = _get_virtual_pin_value(token, ph_pin)
    gas_ppm = _get_virtual_pin_value(token, gas_pin)

    aqi = _clamp(gas_ppm * 1.8, 0, 500)
    alerts = _build_alerts(aqi, noise_db, water_ph)

    return {
        "area_name": config.get("area_name") or "Personal Area",
        "source": "Blynk Cloud",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "reading": {
            "temperature": round(temperature, 2),
            "humidity": round(humidity, 2),
            "noise_db": round(noise_db, 2),
            "water_ph": round(water_ph, 2),
            "gas_ppm": round(gas_ppm, 2),
            "aqi": round(aqi, 0),
        },
        "pin_diagnostics": {
            "pin_map": {
                "temperature": temp_pin,
                "humidity": humidity_pin,
                "noise_db": noise_pin,
                "water_ph": ph_pin,
                "gas_ppm": gas_pin,
            },
            "raw_values": {
                temp_pin.lower(): round(temperature, 2),
                humidity_pin.lower(): round(humidity, 2),
                noise_pin.lower(): round(noise_db, 2),
                ph_pin.lower(): round(water_ph, 2),
                gas_pin.lower(): round(gas_ppm, 2),
            },
        },
        "alerts": alerts,
        "life_expectancy_impact": _life_expectancy_impact(aqi, noise_db, water_ph),
        "health_impacts": _health_impacts(aqi, noise_db, water_ph),
    }
