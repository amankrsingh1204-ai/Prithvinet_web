from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

SERVICE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SERVICE_DIR.parents[1]
WORKSPACE_ROOT = BACKEND_DIR.parent

load_dotenv(BACKEND_DIR / ".env")
load_dotenv(WORKSPACE_ROOT / ".env")

OPENAQ_BASE_URL = os.getenv("OPENAQ_BASE_URL", "https://api.openaq.org/v2/latest")
OPENAQ_V3_BASE_URL = os.getenv("OPENAQ_V3_BASE_URL", "https://api.openaq.org/v3/latest")
OPENAQ_V3_LOCATIONS_URL = os.getenv("OPENAQ_V3_LOCATIONS_URL", "https://api.openaq.org/v3/locations")
OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY", "")

CITY_COORDINATES: dict[str, tuple[float, float]] = {
    "raipur": (21.2514, 81.6296),
    "bhilai": (21.1938, 81.3509),
    "abhanpur": (21.1330, 81.7630),
    "ranchi": (23.3441, 85.3096),
    "patna": (25.5941, 85.1376),
    "durg": (21.1904, 81.2849),
    "delhi": (28.6139, 77.2090),
    "mumbai": (19.0760, 72.8777),
    "kolkata": (22.5726, 88.3639),
    "chennai": (13.0827, 80.2707),
    "bengaluru": (12.9716, 77.5946),
}


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _linear_sub_index(c: float, bp_low: float, bp_high: float, i_low: int, i_high: int) -> int:
    if bp_high == bp_low:
        return i_high
    return int(round(((i_high - i_low) / (bp_high - bp_low)) * (c - bp_low) + i_low))


def pm25_to_aqi(pm25: float) -> int:
    if pm25 <= 30:
        return _linear_sub_index(pm25, 0, 30, 0, 50)
    if pm25 <= 60:
        return _linear_sub_index(pm25, 31, 60, 51, 100)
    if pm25 <= 90:
        return _linear_sub_index(pm25, 61, 90, 101, 200)
    if pm25 <= 120:
        return _linear_sub_index(pm25, 91, 120, 201, 300)
    if pm25 <= 250:
        return _linear_sub_index(pm25, 121, 250, 301, 500)
    return 500


def classify_aqi(aqi: int, pm25: float | None = None) -> str:
    if pm25 is not None:
        if pm25 <= 30:
            return "Good"
        if pm25 <= 60:
            return "Moderate"
        if pm25 <= 90:
            return "Poor"
        if pm25 <= 120:
            return "Very Poor"
        return "Severe"

    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 200:
        return "Poor"
    if aqi <= 300:
        return "Very Poor"
    return "Severe"


def _extract_pm_values(results: list[dict[str, Any]]) -> tuple[float | None, float | None]:
    pm25: float | None = None
    pm10: float | None = None

    for location in results:
        for measurement in location.get("measurements") or []:
            parameter = str(measurement.get("parameter") or "").strip().lower()
            value = measurement.get("value")
            if parameter == "pm25" and pm25 is None:
                pm25 = _to_float(value, default=0.0)
            elif parameter == "pm10" and pm10 is None:
                pm10 = _to_float(value, default=0.0)

            if pm25 is not None and pm10 is not None:
                return pm25, pm10

    return pm25, pm10


def _normalize_city(city: str) -> str:
    return (city or "").strip().lower()


def _apply_city_overrides(payload: dict[str, Any], requested_city: str) -> dict[str, Any]:
    # Keep city override hook as a no-op so AQI always reflects upstream data.
    return payload


def _openaq_headers() -> dict[str, str]:
    headers: dict[str, str] = {"Accept": "application/json"}
    if OPENAQ_API_KEY:
        headers["X-API-Key"] = OPENAQ_API_KEY
    return headers


def _select_best_location(locations: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not locations:
        return None

    candidates = [loc for loc in locations if (loc.get("sensors") or [])]
    if not candidates:
        candidates = locations

    candidates.sort(key=lambda loc: float(loc.get("distance") or 1e12))
    return candidates[0] if candidates else None


def _fetch_v3_locations_for_city(city: str) -> list[dict[str, Any]]:
    city_key = _normalize_city(city)
    headers = _openaq_headers()

    coords = CITY_COORDINATES.get(city_key)
    if coords:
        lat, lon = coords
        params = {
            "coordinates": f"{lat},{lon}",
            "radius": 25000,
            "country": "IN",
            "limit": 25,
            "page": 1,
            "order_by": "id",
            "sort": "asc",
        }
        response = requests.get(OPENAQ_V3_LOCATIONS_URL, params=params, headers=headers, timeout=20)
        response.raise_for_status()
        data = response.json() or {}
        locations = data.get("results") or []
        if locations:
            return locations

    params = {
        "city": city,
        "country": "IN",
        "limit": 25,
        "page": 1,
        "order_by": "id",
        "sort": "asc",
    }
    response = requests.get(OPENAQ_V3_LOCATIONS_URL, params=params, headers=headers, timeout=20)
    response.raise_for_status()
    data = response.json() or {}
    return data.get("results") or []


def _fetch_v3_location_sensors(location_id: int) -> list[dict[str, Any]]:
    headers = _openaq_headers()
    response = requests.get(f"{OPENAQ_V3_LOCATIONS_URL}/{location_id}/sensors", params={"limit": 100, "page": 1}, headers=headers, timeout=20)
    response.raise_for_status()
    data = response.json() or {}
    return data.get("results") or []


def _fetch_openaq_v3_payload(city: str) -> dict[str, Any] | None:
    if not OPENAQ_API_KEY:
        return None

    locations = _fetch_v3_locations_for_city(city)
    if not locations:
        return None

    sorted_locations = sorted(locations, key=lambda loc: float(loc.get("distance") or 1e12))
    best_location = _select_best_location(sorted_locations)
    if best_location:
        sorted_locations = [best_location] + [loc for loc in sorted_locations if loc is not best_location]

    for location in sorted_locations:
        location_id = location.get("id")
        try:
            location_id_int = int(location_id)
        except (TypeError, ValueError):
            continue

        sensors = _fetch_v3_location_sensors(location_id_int)
        if not sensors:
            continue

        pollutants: dict[str, float] = {}
        for sensor in sensors:
            parameter = ((sensor.get("parameter") or {}).get("name") or "").strip().lower()
            if not parameter:
                continue
            latest = sensor.get("latest") or {}
            value = latest.get("value")
            if value is None:
                continue
            pollutants[parameter] = _to_float(value, default=0.0)

        # Support alternate provider aliases for PM2.5.
        if "pm25" not in pollutants and "pm2.5" in pollutants:
            pollutants["pm25"] = pollutants["pm2.5"]

        pm25 = pollutants.get("pm25")
        if pm25 is None or pm25 <= 0:
            continue

        pm10 = pollutants.get("pm10", 0.0)
        aqi = _to_int(pm25_to_aqi(pm25), default=0)
        status = classify_aqi(aqi, pm25=pm25)

        resolved_city = city
        locality = location.get("locality")
        name = location.get("name")
        if isinstance(locality, str) and locality.strip():
            resolved_city = locality.strip()
        elif isinstance(name, str) and name.strip():
            resolved_city = name.strip()

        return {
            "aqi": aqi,
            "aqi_status": status,
            "status": status,
            "pm25": pm25,
            "pm10": pm10,
            "no2": pollutants.get("no2", 0.0),
            "so2": pollutants.get("so2", 0.0),
            "o3": pollutants.get("o3", 0.0),
            "co": pollutants.get("co", 0.0),
            "bc": pollutants.get("bc", 0.0),
            "noise": None,
            "ph": None,
            "city": resolved_city,
        }

    return None


def _fetch_openaq_v2(city: str) -> tuple[float | None, float | None, str]:
    params = {"city": city, "limit": 100, "page": 1}
    headers: dict[str, str] = {"Accept": "application/json"}

    response = requests.get(OPENAQ_BASE_URL, params=params, headers=headers, timeout=20)
    response.raise_for_status()
    data = response.json() or {}

    results = data.get("results") or []
    if not results:
        return None, None, city

    pm25, pm10 = _extract_pm_values(results)
    resolved_city = city
    city_from_payload = (results[0] or {}).get("city")
    if isinstance(city_from_payload, str) and city_from_payload.strip():
        resolved_city = city_from_payload.strip()
    return pm25, pm10, resolved_city


def _fetch_openaq_v3(city: str) -> tuple[float | None, float | None, str]:
    if not OPENAQ_API_KEY:
        return None, None, city

    params = {"city": city, "limit": 100, "page": 1}
    headers: dict[str, str] = {
        "Accept": "application/json",
        "X-API-Key": OPENAQ_API_KEY,
    }

    response = requests.get(OPENAQ_V3_BASE_URL, params=params, headers=headers, timeout=20)
    response.raise_for_status()
    data = response.json() or {}

    results = data.get("results") or []
    if not results:
        return None, None, city

    pm25, pm10 = _extract_pm_values(results)
    resolved_city = city
    city_from_payload = (results[0] or {}).get("city")
    if isinstance(city_from_payload, str) and city_from_payload.strip():
        resolved_city = city_from_payload.strip()
    return pm25, pm10, resolved_city


def _fetch_openaq_v3_by_location_id(location_id: int, city: str) -> tuple[float | None, float | None, str]:
    params = {"locations_id": location_id, "limit": 100, "page": 1}
    headers: dict[str, str] = {
        "Accept": "application/json",
        "X-API-Key": OPENAQ_API_KEY,
    }

    response = requests.get(OPENAQ_V3_BASE_URL, params=params, headers=headers, timeout=20)
    response.raise_for_status()
    data = response.json() or {}
    results = data.get("results") or []
    if not results:
        return None, None, city

    pm25, pm10 = _extract_pm_values(results)
    resolved_city = city
    city_from_payload = (results[0] or {}).get("city") or (results[0] or {}).get("locality")
    if isinstance(city_from_payload, str) and city_from_payload.strip():
        resolved_city = city_from_payload.strip()
    return pm25, pm10, resolved_city


def _fetch_openaq_v3_nearby(city: str) -> tuple[float | None, float | None, str]:
    if not OPENAQ_API_KEY:
        return None, None, city

    coords = CITY_COORDINATES.get(city.strip().lower())
    if not coords:
        return None, None, city

    lat, lon = coords
    headers: dict[str, str] = {
        "Accept": "application/json",
        "X-API-Key": OPENAQ_API_KEY,
    }
    params = {
        "coordinates": f"{lat},{lon}",
        "radius": 50000,
        "limit": 15,
        "page": 1,
        "order_by": "distance",
        "sort": "asc",
    }

    locations_response = requests.get("https://api.openaq.org/v3/locations", params=params, headers=headers, timeout=20)
    locations_response.raise_for_status()
    locations_data = locations_response.json() or {}
    locations = locations_data.get("results") or []

    for location in locations:
        raw_id = location.get("id")
        if raw_id is None:
            continue
        try:
            location_id = int(raw_id)
        except (TypeError, ValueError):
            continue

        try:
            pm25, pm10, resolved_city = _fetch_openaq_v3_by_location_id(location_id, city)
        except requests.RequestException:
            continue

        if pm25 is not None:
            return pm25, pm10, resolved_city

    return None, None, city


def fetch_aqi(city: str) -> dict[str, Any] | None:
    if OPENAQ_API_KEY:
        try:
            payload = _fetch_openaq_v3_payload(city)
            if payload:
                return _apply_city_overrides(payload, city)
        except requests.RequestException:
            pass

    pm25, pm10, resolved_city = None, None, city

    # OpenAQ v3 is the current API and requires X-API-Key.
    if OPENAQ_API_KEY:
        try:
            pm25, pm10, resolved_city = _fetch_openaq_v3(city)
        except requests.RequestException:
            pm25, pm10, resolved_city = None, None, city

    # Fallback to v2 for compatibility where older endpoints are still available.
    if pm25 is None:
        try:
            pm25, pm10, resolved_city = _fetch_openaq_v3_nearby(city)
        except requests.RequestException:
            pm25, pm10, resolved_city = None, None, city

    if pm25 is None:
        try:
            pm25, pm10, resolved_city = _fetch_openaq_v2(city)
        except requests.RequestException:
            pm25, pm10, resolved_city = None, None, city

    if pm25 is None:
        return None

    aqi = _to_int(pm25_to_aqi(pm25), default=0)
    status = classify_aqi(aqi, pm25=pm25)

    # Keep existing compatibility fields used by current backend/frontend.
    payload = {
        "aqi": aqi,
        "aqi_status": status,
        "status": status,
        "pm25": pm25,
        "pm10": pm10 if pm10 is not None else 0.0,
        "no2": 0.0,
        "so2": 0.0,
        "o3": 0.0,
        "co": 0.0,
        "bc": 0.0,
        "noise": None,
        "ph": None,
        "city": resolved_city,
    }
    return _apply_city_overrides(payload, city)
