from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from ..database import Base


class IoTAlert(Base):
    # Stores compliance alerts generated from incoming IoT sensor readings.
    __tablename__ = "iot_alerts"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, nullable=False, default=0)
    parameter = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    message = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved = Column(Boolean, default=False, nullable=False)
