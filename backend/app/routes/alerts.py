from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models.alert import Alert, AlertSubscription

router = APIRouter(tags=["Alerts"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class AlertSubscribeRequest(BaseModel):
    email: str


def _serialize_alert(row: Alert) -> dict:
    title = (row.title or "").strip()
    normalized_type = title[:-6] if title.endswith(" Alert") else title

    return {
        "id": row.id,
        "type": normalized_type or row.type,
        "value": row.actual_value,
        "message": row.message,
        "timestamp": row.triggered_at,
        "location": row.location,
    }


@router.post("/alerts/subscribe")
def subscribe_alert_email(payload: AlertSubscribeRequest, db: Session = Depends(get_db)):
    email = payload.email.strip()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Invalid email address")

    existing = db.query(AlertSubscription).filter(AlertSubscription.email == email).first()
    if existing is not None:
        existing.active = True
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return {"message": "Alert subscription updated", "email": existing.email}

    row = AlertSubscription(email=email, active=True)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"message": "Alert subscription saved", "email": row.email}


@router.get("/alerts")
def get_alerts(
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    rows = db.query(Alert).order_by(Alert.triggered_at.desc()).limit(limit).all()
    return [_serialize_alert(row) for row in rows]