from __future__ import annotations

from sqlalchemy import Column, DateTime, Float, Integer, func

from ..database import Base


class IoTData(Base):
    __tablename__ = "iot_readings"

    id = Column(Integer, primary_key=True, index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    noise_db = Column(Float)
    water_ph = Column(Float)
    gas_ppm = Column(Float)
    timestamp = Column(DateTime, server_default=func.now(), nullable=False)
