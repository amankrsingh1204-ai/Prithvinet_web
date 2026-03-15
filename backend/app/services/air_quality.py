from __future__ import annotations

import os
from typing import Any

import httpx


OWM_INDEX_TO_AQI: dict[int, int] = {
    1: 25,
    2: 75,
    3: 125,
    4: 175,
    5: 250,
}


def _aqi_status_from_owm_index(index: int) -> str:
    if index <= 1:
        return "Good"
    if index == 2:
        return "Fair"
    if index == 3:
        return "Moderate"
    if index == 4:
        return "Poor"
    return "Very Poor"


async def _resolve_coordinates(
    client: httpx.AsyncClient,
    app_id: str,
    city: str | None,
    lat: float | None,
    lon: float | None,
) -> tuple[float, float, str | None]:
    if lat is not None and lon is not None:
        return float(lat), float(lon), city.strip() if isinstance(city, str) and city.strip() else None

    if city and city.strip():
        geo_params = {
            "q": city.strip(),
            "limit": 1,
            "appid": app_id,
        }
        geo_response = await client.get("https://api.openweathermap.org/geo/1.0/direct", params=geo_params)
        geo_response.raise_for_status()
        geo_data = geo_response.json()
        if not isinstance(geo_data, list) or not geo_data:
            raise ValueError("City coordinates not found")
        first = geo_data[0] or {}
        resolved_lat = first.get("lat")
        resolved_lon = first.get("lon")
        if resolved_lat is None or resolved_lon is None:
            raise ValueError("City coordinates missing from geocoding result")
        resolved_name = first.get("name") if isinstance(first.get("name"), str) else city.strip()
        return float(resolved_lat), float(resolved_lon), resolved_name

    raise ValueError("Provide either city or lat/lon")


async def fetch_openweather_air_quality(city: str | None = None, lat: float | None = None, lon: float | None = None) -> dict[str, Any]:
    app_id = os.getenv("OPENWEATHER_API_KEY", "").strip()
    if not app_id:
        raise RuntimeError("OPENWEATHER_API_KEY is not configured")

    async with httpx.AsyncClient(timeout=15) as client:
        resolved_lat, resolved_lon, resolved_city = await _resolve_coordinates(client, app_id, city, lat, lon)
        response = await client.get(
            "https://api.openweathermap.org/data/2.5/air_pollution",
            params={"lat": resolved_lat, "lon": resolved_lon, "appid": app_id},
        )
        response.raise_for_status()
        data = response.json()

    records = (data.get("list") or []) if isinstance(data, dict) else []
    if not records:
        raise ValueError("No air pollution records available")

    first = records[0] or {}
    main_data = first.get("main") if isinstance(first, dict) else {}
    components = first.get("components") if isinstance(first, dict) else {}

    index_value = int((main_data or {}).get("aqi") or 0)
    if index_value <= 0:
        raise ValueError("Invalid AQI index from provider")

    aqi = OWM_INDEX_TO_AQI.get(index_value, 0)
    status = _aqi_status_from_owm_index(index_value)

    return {
        "provider": "OpenWeather Air Pollution",
        "city": resolved_city or city,
        "aqi": aqi,
        "aqi_index": index_value,
        "status": status,
        "pm2_5": (components or {}).get("pm2_5") if isinstance(components, dict) else None,
        "pm10": (components or {}).get("pm10") if isinstance(components, dict) else None,
        "no2": (components or {}).get("no2") if isinstance(components, dict) else None,
        "so2": (components or {}).get("so2") if isinstance(components, dict) else None,
        "o3": (components or {}).get("o3") if isinstance(components, dict) else None,
        "co": (components or {}).get("co") if isinstance(components, dict) else None,
        "lat": resolved_lat,
        "lon": resolved_lon,
        "raw": data,
    }
