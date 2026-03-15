from __future__ import annotations

import os
from typing import Any

import httpx


async def fetch_water_quality(lat: float | None, lng: float | None, within: float) -> list[dict[str, Any]]:
    url = os.getenv(
        "USGS_WATER_PH_URL",
        "https://waterservices.usgs.gov/nwis/iv/?format=json&parameterCd=00400&sites=01646500",
    )

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
    except Exception:
        return []

    time_series = (
        ((data or {}).get("value") or {}).get("timeSeries")
        if isinstance(data, dict)
        else None
    )

    if not isinstance(time_series, list) or not time_series:
        return []

    stations: list[dict[str, Any]] = []
    for idx, series in enumerate(time_series):
        source_info = series.get("sourceInfo") if isinstance(series, dict) else {}
        location = ((source_info or {}).get("geoLocation") or {}).get("geogLocation") or {}

        try:
            src_lat = float(location.get("latitude") or 0)
            src_lng = float(location.get("longitude") or 0)
        except Exception:
            src_lat = 0.0
            src_lng = 0.0

        values_blocks = series.get("values") if isinstance(series, dict) else []
        last_ph: float | None = None
        observed_at: str | None = None

        if isinstance(values_blocks, list):
            for block in values_blocks:
                value_list = block.get("value") if isinstance(block, dict) else []
                if not isinstance(value_list, list) or not value_list:
                    continue
                latest = value_list[-1]
                raw_value = (latest or {}).get("value")
                observed_at = (latest or {}).get("dateTime")
                try:
                    last_ph = float(raw_value)
                except Exception:
                    last_ph = None

        if last_ph is None:
            continue

        if not src_lat or not src_lng:
            continue

        stations.append(
            {
                "id": (source_info or {}).get("siteCode", [{}])[0].get("value", f"USGS-{idx}") if isinstance((source_info or {}).get("siteCode"), list) else f"USGS-{idx}",
                "name": (source_info or {}).get("siteName") or f"USGS Station {idx + 1}",
                "lat": src_lat,
                "lng": src_lng,
                "type": "River",
                "provider": "USGS NWIS",
                "ph": round(last_ph, 2),
                "turbidity": None,
                "contaminants": "Not reported",
                "dissolved_oxygen": None,
                "bod": None,
                "observed_at": observed_at,
            }
        )

    if lat is not None and lng is not None and stations:
        radius = within / 111
        nearby = [
            s for s in stations
            if abs(float(s["lat"]) - lat) < radius and abs(float(s["lng"]) - lng) < radius
        ]
        if nearby:
            return nearby[:50]

    return stations[:50]
