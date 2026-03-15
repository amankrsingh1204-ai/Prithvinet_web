from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field


class SimulateRequest(BaseModel):
    sensorId: str
    value: float
    isSimulated: bool = True


class AiPromptRequest(BaseModel):
    prompt: str


class GenerateGlobalDataRequest(BaseModel):
    type: Literal["pollution", "industries"]
    batches: int = Field(default=2, ge=1, le=5)
    itemsPerBatch: int = Field(default=20, ge=5, le=50)


class LocationProfileRequest(BaseModel):
    lat: float
    lng: float
    city: str
    state: str
    country: str
    openAqData: Any | None = None
    industrialAreas: list[dict[str, Any]] = Field(default_factory=list)
    waterData: list[dict[str, Any]] | None = None


class ForecastRequest(BaseModel):
    metricPayload: dict[str, list[dict[str, Any]]]


class DashboardSearchRequest(BaseModel):
    query: str


class ComplianceCopilotRequest(BaseModel):
    query: str
    industrialAreas: list[dict[str, Any]] = Field(default_factory=list)
    pollutionAreas: list[dict[str, Any]] = Field(default_factory=list)
    weatherData: dict[str, Any] | None = None


# LOGIN REQUEST
class LoginRequest(BaseModel):
    email: str
    password: str
    role: str | None = None


class AddMonitoringTeamRequest(BaseModel):
    email: str
    password: str
    district_name: str
    team_zone: Literal["north", "south"]


class MonitoringTeamResponse(BaseModel):
    id: int
    email: str
    state_id: int
    district_name: str
    team_zone: str


class AddRegionalOfficerRequest(BaseModel):
    email: str
    password: str
    state_id: int


class RegionalOfficerResponse(BaseModel):
    id: int
    email: str
    state_id: int
    state_name: str