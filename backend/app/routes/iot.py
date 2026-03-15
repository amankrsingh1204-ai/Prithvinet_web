from __future__ import annotations

import asyncio
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from ..db import get_connection
from ..database import SessionLocal
from ..iot_schema import IoTSensorCreate
from ..models.alert import Alert
from ..models.iot_alerts import IoTAlert
from ..models.iot_model import IoTData
from ..services.alert_service import check_alerts
from ..services.email_service import send_alert_email
from ..services.iot_alert_service import check_environmental_alerts
from ..services.personal_iot_service import build_personal_iot_payload

router = APIRouter(prefix="/iot", tags=["IoT"])
ws_router = APIRouter(tags=["IoT Alerts"])
alert_clients: set[WebSocket] = set()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _serialize_alert(alert: IoTAlert) -> dict:
    return {
        "id": alert.id,
        "location_id": alert.location_id,
        "parameter": alert.parameter,
        "value": alert.value,
        "threshold": alert.threshold,
        "message": alert.message,
        "timestamp": alert.timestamp,
        "resolved": alert.resolved,
    }


def _is_email_suppressed(db: Session, alert_type: str) -> bool:
    # Prevent repeated emails for the same alert type within 5 minutes.
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    alert_title = f"{alert_type} Alert"
    recent_rows = (
        db.query(Alert)
        .filter(Alert.title == alert_title)
        .filter(Alert.triggered_at >= cutoff)
        .order_by(Alert.triggered_at.desc())
        .all()
    )

    for row in recent_rows:
        notifications = row.notifications_sent or {}
        if isinstance(notifications, dict) and notifications.get("email") is True:
            return True

    return False


def _get_active_blynk_config() -> dict:
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT id, area_name, auth_token, template_id, template_name, pin_map, active
            FROM iot_blynk_configs
            WHERE active = TRUE
            ORDER BY id ASC
            LIMIT 1;
            """
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="No active Blynk configuration found")
        return dict(row)
    finally:
        cur.close()
        conn.close()


async def _broadcast_alerts(alerts: list[dict]) -> None:
    if not alerts or not alert_clients:
        return

    disconnected: list[WebSocket] = []
    payload = {"type": "alerts", "alerts": alerts}

    for ws in list(alert_clients):
        try:
            await ws.send_json(payload)
        except Exception:
            disconnected.append(ws)

    for ws in disconnected:
        alert_clients.discard(ws)


@router.post("/data")
async def receive_iot_data(data: IoTSensorCreate, db: Session = Depends(get_db)):
    resolved_ph = data.ph if data.ph is not None else data.water_ph
    resolved_air_quality = data.air_quality if data.air_quality is not None else data.gas_ppm

    record = IoTData(
        temperature=data.temperature,
        humidity=data.humidity,
        noise_db=data.noise_db,
        water_ph=resolved_ph,
        gas_ppm=resolved_air_quality,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    alert_candidates = check_environmental_alerts(
        {
            "location_id": data.location_id,
            "noise_db": data.noise_db,
            "ph": resolved_ph,
        }
    )

    saved_alerts: list[dict] = []
    if alert_candidates:
        for candidate in alert_candidates:
            alert_row = IoTAlert(
                location_id=candidate["location_id"],
                parameter=candidate["parameter"],
                value=candidate["value"],
                threshold=candidate["threshold"],
                message=candidate["message"],
            )
            db.add(alert_row)

        db.commit()

        latest_alert_rows = (
            db.query(IoTAlert)
            .order_by(IoTAlert.id.desc())
            .limit(len(alert_candidates))
            .all()
        )
        saved_alerts = [_serialize_alert(row) for row in reversed(latest_alert_rows)]

        await _broadcast_alerts(saved_alerts)

    threshold_input = {
        "temperature": data.temperature,
        "humidity": data.humidity,
        "noise_db": data.noise_db,
        "water_ph": resolved_ph,
        "gas_ppm": resolved_air_quality,
        # Keep AQI derivation backward compatible with existing payload fields.
        "aqi": data.air_quality if data.air_quality is not None else resolved_air_quality,
    }
    threshold_alerts = check_alerts(threshold_input)

    email_candidates: list[dict] = []
    if threshold_alerts:
        location = str(data.location_id)
        created_alert_rows: list[tuple[str, Alert]] = []
        threshold_map = {
            "AQI": 150.0,
            "Water pH": 7.5,
            "Noise": 45.0,
        }

        def _severity_for_alert(alert_type: str, value: float) -> str:
            if alert_type == "AQI":
                if value > 250:
                    return "CRITICAL"
                if value > 200:
                    return "HIGH"
                return "MEDIUM"
            if alert_type == "Noise":
                if value > 85:
                    return "HIGH"
                if value > 60:
                    return "MEDIUM"
                return "LOW"
            if alert_type == "Water pH":
                if value < 6.0 or value > 7.5:
                    return "HIGH"
                return "MEDIUM"
            return "MEDIUM"

        for item in threshold_alerts:
            alert_type = str(item.get("type", "Unknown"))
            alert_value = float(item.get("value", 0.0))
            suppressed = _is_email_suppressed(db, alert_type)
            if not suppressed:
                email_candidates.append(item)

            alert_row = Alert(
                type="LIMIT_EXCEEDED",
                severity=_severity_for_alert(alert_type, alert_value),
                status="OPEN",
                title=f"{alert_type} Alert",
                message=str(item.get("message", "")),
                threshold_value=threshold_map.get(alert_type),
                actual_value=alert_value,
                triggered_at=datetime.utcnow(),
                escalation_level=1,
                notifications_sent={"email": False, "suppressed": suppressed},
                metadata_json={"source": "iot", "alertType": alert_type},
                location=location,
            )
            db.add(alert_row)
            created_alert_rows.append((alert_type, alert_row))

        db.commit()

        if email_candidates:
            try:
                if send_alert_email(email_candidates):
                    candidate_types = {str(item.get("type", "Unknown")) for item in email_candidates}
                    for alert_type, alert_row in created_alert_rows:
                        if alert_type in candidate_types:
                            alert_row.notifications_sent = {"email": True, "suppressed": False}
                    db.commit()
            except Exception:
                # Do not break IoT ingestion if SMTP fails.
                pass

    return {
        "message": "data stored",
        "alerts": saved_alerts,
    }


@router.get("/latest")
def get_latest_data(db: Session = Depends(get_db)):
    latest = db.query(IoTData).order_by(IoTData.timestamp.desc()).first()

    if latest is None:
        return {"message": "No IoT data available yet"}

    return {
        "temperature": latest.temperature,
        "humidity": latest.humidity,
        "noise_db": latest.noise_db,
        "water_ph": latest.water_ph,
        "gas_ppm": latest.gas_ppm,
        "timestamp": latest.timestamp,
    }


@router.get("/personal/live")
def get_personal_live_iot_data():
    config = _get_active_blynk_config()

    try:
        return build_personal_iot_payload(config)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch live Blynk data: {exc}") from exc


@router.get("/history")
def get_iot_history(
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    # Returns latest records ordered by timestamp for dashboard trend charts.
    rows = (
        db.query(IoTData)
        .order_by(IoTData.timestamp.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "temperature": row.temperature,
            "humidity": row.humidity,
            "noise_db": row.noise_db,
            "water_ph": row.water_ph,
            "gas_ppm": row.gas_ppm,
            "timestamp": row.timestamp,
        }
        for row in rows
    ]


@router.get("/alerts")
def get_iot_alerts(
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(IoTAlert)
        .order_by(IoTAlert.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [_serialize_alert(row) for row in rows]


@router.get("/alerts/unresolved")
def get_unresolved_iot_alerts(
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(IoTAlert)
        .filter(IoTAlert.resolved.is_(False))
        .order_by(IoTAlert.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [_serialize_alert(row) for row in rows]


@router.post("/alerts/{alert_id}/resolve")
def resolve_iot_alert(alert_id: int, db: Session = Depends(get_db)):
    row = db.query(IoTAlert).filter(IoTAlert.id == alert_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    row.resolved = True
    db.commit()
    db.refresh(row)

    return {
        "message": "Alert resolved",
        "alert": _serialize_alert(row),
    }


@ws_router.websocket("/ws/alerts")
async def alerts_websocket(websocket: WebSocket):
    await websocket.accept()
    alert_clients.add(websocket)

    try:
        while True:
            # Keep socket alive and allow client pings/messages.
            await websocket.receive_text()
    except WebSocketDisconnect:
        alert_clients.discard(websocket)
    except Exception:
        alert_clients.discard(websocket)


@ws_router.websocket("/ws/iot/personal/live")
async def personal_live_iot_websocket(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            try:
                config = _get_active_blynk_config()
                payload = build_personal_iot_payload(config)
                await websocket.send_json({"type": "personal_live", "payload": payload})
            except HTTPException as exc:
                await websocket.send_json(
                    {
                        "type": "error",
                        "detail": exc.detail,
                    }
                )
            except Exception as exc:
                await websocket.send_json(
                    {
                        "type": "error",
                        "detail": f"Failed to fetch live Blynk data: {exc}",
                    }
                )

            await asyncio.sleep(5)
    except WebSocketDisconnect:
        return
