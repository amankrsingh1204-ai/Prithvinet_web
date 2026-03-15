from __future__ import annotations

from pydantic import BaseModel, Field


class IoTSensorCreate(BaseModel):
    # Keep ESP32 payload compatibility without breaking existing clients.
    location_id: int = Field(default=0, ge=0)
    temperature: float = Field(ge=-50, le=100)
    humidity: float = Field(ge=0, le=100)
    air_quality: float | None = Field(default=None, ge=0)
    noise_db: float = Field(ge=0, le=300)
    ph: float | None = Field(default=None, ge=0, le=14)
    water_ph: float | None = Field(default=None, ge=0, le=14)
    gas_ppm: float | None = Field(default=None, ge=0)
