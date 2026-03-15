from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from ..database import Base


ALERT_TYPE_ENUM = Enum(
    "LIMIT_EXCEEDED",
    "ANOMALY_DETECTED",
    "MISSING_REPORT",
    "CALIBRATION_DUE",
    "MAINTENANCE_REQUIRED",
    "EMERGENCY",
    "FORECAST_WARNING",
    name="AlertType",
    create_constraint=False,
)

ALERT_SEVERITY_ENUM = Enum(
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
    name="AlertSeverity",
    create_constraint=False,
)

ALERT_STATUS_ENUM = Enum(
    "OPEN",
    "ACKNOWLEDGED",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
    "FALSE_ALARM",
    name="AlertStatus",
    create_constraint=False,
)


class Alert(Base):
    # Unified environmental alert table consumed by /alerts API.
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    type = Column(ALERT_TYPE_ENUM, nullable=False, default="LIMIT_EXCEEDED")
    severity = Column(ALERT_SEVERITY_ENUM, nullable=False, default="HIGH")
    status = Column(ALERT_STATUS_ENUM, nullable=False, default="OPEN")
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)

    location_id = Column("locationId", String, nullable=True)
    industry_id = Column("industryId", String, nullable=True)
    parameter_id = Column("parameterId", String, nullable=True)
    threshold_value = Column("thresholdValue", Float, nullable=True)
    actual_value = Column("actualValue", Float, nullable=True)
    triggered_at = Column("triggeredAt", DateTime, nullable=False, default=datetime.utcnow)

    acknowledged_by = Column("acknowledgedBy", String, nullable=True)
    acknowledged_at = Column("acknowledgedAt", DateTime, nullable=True)
    resolved_by = Column("resolvedBy", String, nullable=True)
    resolved_at = Column("resolvedAt", DateTime, nullable=True)
    resolution_notes = Column("resolutionNotes", String, nullable=True)
    escalation_level = Column("escalationLevel", Integer, nullable=False, default=1)
    notifications_sent = Column("notificationsSent", JSONB, nullable=True)
    metadata_json = Column("metadata", JSONB, nullable=True)
    created_at = Column("createdAt", DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column("updatedAt", DateTime, nullable=False, default=datetime.utcnow)

    # Added as extension column (if present).
    location = Column(String, nullable=True)


class AlertSubscription(Base):
    # Stores destination email addresses for environmental alert notifications.
    __tablename__ = "alert_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)