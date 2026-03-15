from __future__ import annotations

import json
import os
import random
from typing import Any

from google import genai
from google.genai import types


def _client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    return genai.Client(api_key=api_key)


def _generate(prompt: str, response_json: bool = False, retries: int = 5) -> str:
    client = _client()
    last_err: Exception | None = None

    for i in range(retries):
        try:
            config = types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0),
                response_mime_type="application/json" if response_json else None,
            )
            result = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=config,
            )
            return result.text or ""
        except Exception as err:
            last_err = err
            if i == retries - 1:
                break

    if last_err:
        raise last_err
    return ""


def generate_noise_forecast(point: dict[str, Any]) -> str:
    prompt = f"""
Predict the noise pollution levels for the next 24 hours for this industrial area:
Name: {point.get('name')}
Type: {point.get('type')}
Current Noise: {point.get('noise')} dB
Current AQI: {point.get('aqi')}
Industry Data: {json.dumps(point.get('industryData'))}
Provide a concise forecast (max 50 words) including peak noise times and estimated dB levels.
"""
    return _generate(prompt, response_json=False)


def generate_global_data(data_type: str, batches: int = 2, items_per_batch: int = 20) -> list[dict[str, Any]]:
    all_data: list[dict[str, Any]] = []

    for b in range(batches):
        if data_type == "pollution":
            prompt = (
                f"Generate a JSON array of {items_per_batch} major polluted areas worldwide (batch {b+1}/{batches}), "
                "including several Indian state capitals. Each object: "
                "{lat:number,lng:number,name:string,type:'AIR',severity:'HIGH'|'CRITICAL',aqi:number,co:number,no2:number,pm25:number,description:string,contributingFactors:string[]}. "
                "Return only valid JSON."
            )
        else:
            prompt = (
                f"Generate a JSON array of {items_per_batch} major industrial areas worldwide (batch {b+1}/{batches}), with a heavy focus on India. "
                "Include Shipbuilding, Petroleum Refineries, Fertilizers, Electronics, Automobiles, Software Hubs, and Power Plants. "
                "Each object: {lat:number,lng:number,name:string,type:string,aqi:number,noise:number,waterPh:number,description:string,complianceStatus:'Compliant'|'Non-Compliant'|'Warning',nearbyIndustries:[{name:string,type:string,lat:number,lng:number}]}. "
                "Return only valid JSON."
            )

        text = _generate(prompt, response_json=True)
        if not text:
            continue
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                all_data.extend(parsed)
        except Exception:
            continue

    return all_data


def generate_location_profile(payload: dict[str, Any]) -> dict[str, Any]:
    prompt = f"""
Provide an environmental profile for {payload.get('city')}, {payload.get('state')}, {payload.get('country')} (Lat: {payload.get('lat')}, Lng: {payload.get('lng')}).
Real data context:
- Air (OpenAQ): {json.dumps(payload.get('openAqData'))}
- Industrial Areas (Overpass): {json.dumps(payload.get('industrialAreas'))}
- Water Stations: {json.dumps(payload.get('waterData'))}

Return strict JSON:
{{
  "city": "{payload.get('city')}",
  "state": "{payload.get('state')}",
  "country": "{payload.get('country')}",
  "aqi": number,
  "noiseLevel": number,
  "waterPh": number,
  "complianceStatus": "Compliant" | "Non-Compliant" | "Warning",
  "status": "Good" | "Moderate" | "Unhealthy" | "Very Unhealthy" | "Hazardous",
  "details": {{"CO": number, "NO2": number, "O3": number, "PM10": number, "PM2.5": number, "SO2": number}},
  "nearbyPoints": [{{"name": string, "lat": number, "lng": number, "type": "Industrial" | "Sensor" | "Hotspot", "aqi": number, "noise": number, "waterPh": number, "description": string, "contributingFactors": string[]}}],
  "insights": "string"
}}
"""

    text = _generate(prompt, response_json=True)
    if not text:
        return {}
    return json.loads(text)


def generate_forecast(metric_payload: dict[str, Any]) -> dict[str, Any]:
    prompt = f"""
You are an environmental forecasting model.
Based on recent readings, predict AQI, Noise, and pH for 24h, 48h, and 72h.
Data: {json.dumps(metric_payload)}

Return strict JSON only:
{{
  "metrics": {{
    "aqi": {{"horizons": [{{"window":"24h","value":number,"uncertainty":number,"risk":"Low|Moderate|High|Critical"}},{{"window":"48h","value":number,"uncertainty":number,"risk":"Low|Moderate|High|Critical"}},{{"window":"72h","value":number,"uncertainty":number,"risk":"Low|Moderate|High|Critical"}}],"analysis":"string"}},
    "noise": {{"horizons": [{{"window":"24h","value":number,"uncertainty":number,"risk":"Low|Moderate|High|Critical"}},{{"window":"48h","value":number,"uncertainty":number,"risk":"Low|Moderate|High|Critical"}},{{"window":"72h","value":number,"uncertainty":number,"risk":"Low|Moderate|High|Critical"}}],"analysis":"string"}},
    "ph": {{"horizons": [{{"window":"24h","value":number,"uncertainty":number,"risk":"Low|Moderate|High|Critical"}},{{"window":"48h","value":number,"uncertainty":number,"risk":"Low|Moderate|High|Critical"}},{{"window":"72h","value":number,"uncertainty":number,"risk":"Low|Moderate|High|Critical"}}],"analysis":"string"}}
  }},
  "analysis": "string"
}}
"""

    text = _generate(prompt, response_json=True)
    if not text:
        return {}
    return json.loads(text)


def dashboard_search(query: str) -> dict[str, Any]:
    prompt = (
        f'Provide current environmental pollution data for "{query}". Return ONLY a JSON object: '
        '{city: string, state: string, country: string, aqi: number, status: string, noiseLevel: number, waterPh: number, complianceStatus: string, details: { [key: string]: string }}.'
    )
    text = _generate(prompt, response_json=True)
    if not text:
        return {}
    return json.loads(text)


def compliance_copilot(query: str, industrial_areas: list[dict[str, Any]], pollution_areas: list[dict[str, Any]], weather_data: dict[str, Any] | None) -> str:
    system_prompt = f"""
You are the AI Assisted Compliance Copilot, an environmental simulation engine.
Context:
- Industrial Areas: {json.dumps(industrial_areas[:40])}
- Pollution Hotspots: {json.dumps(pollution_areas[:40])}
- Current Weather: {json.dumps(weather_data or {})}

Respond professionally in markdown. Include simulation confidence (0-100%).
"""
    full_prompt = f"{system_prompt}\nUser Query: {query}"
    return _generate(full_prompt, response_json=False)


def indian_industries() -> list[dict[str, Any]]:
    prompt = "Generate a JSON array of 60 major industrial regions in India. Include locations for Shipbuilding, Petroleum Refineries, Fertilizers, Electronics, Automobiles, Software Hubs, NTPC Power Plants, Coal Mines, Steel, and Textiles. Each object: {lat:number,lng:number,name:string,type:string,aqi:number,noise:number,waterPh:number,description:string,complianceStatus:'Compliant'|'Non-Compliant'|'Warning',nearbyIndustries:[{name:string,type:string,lat:number,lng:number}]}. Return only JSON array."
    text = _generate(prompt, response_json=True)
    if not text:
        return []
    data = json.loads(text)
    if not isinstance(data, list):
        return []

    filtered: list[dict[str, Any]] = []
    for idx, item in enumerate(data):
        lat = item.get("lat")
        lng = item.get("lng")
        if isinstance(lat, (int, float)) and isinstance(lng, (int, float)) and 6 < lat < 38 and 68 < lng < 98:
            item["id"] = f"india-ind-{idx}-{random.randint(1000, 9999)}"
            filtered.append(item)

    return filtered
