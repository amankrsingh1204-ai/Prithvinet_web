from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage
from typing import Any

from ..db import get_connection


def _resolve_receiver_email() -> str | None:
    # Prefer active DB subscription if available, then fall back to env receiver.
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT email
            FROM alert_subscriptions
            WHERE active = TRUE
            ORDER BY updated_at DESC, id DESC
            LIMIT 1;
            """
        )
        row = cur.fetchone()
        if row and row.get("email"):
            return str(row["email"])
    except Exception:
        pass
    finally:
        cur.close()
        conn.close()

    return os.getenv("ALERT_RECEIVER")


def send_alert_email(alerts: list[dict[str, Any]]) -> bool:
    """
    Sends environmental alert notifications through Gmail SMTP.
    Returns True when an email is sent successfully.
    """
    if not alerts:
        return False

    sender = os.getenv("EMAIL_ADDRESS")
    password = os.getenv("EMAIL_PASSWORD")
    receiver = _resolve_receiver_email()

    if not sender or not password or not receiver:
        return False

    lines = ["Environmental Alert Detected", ""]
    for alert in alerts:
        alert_type = alert.get("type", "Unknown")
        value = alert.get("value", "N/A")
        message = alert.get("message", "")
        lines.extend(
            [
                f"Alert Type: {alert_type}",
                f"Value: {value}",
                f"Message: {message}",
                "",
            ]
        )

    msg = EmailMessage()
    msg["Subject"] = "PrithviNet Environmental Alert"
    msg["From"] = sender
    msg["To"] = receiver
    msg.set_content("\n".join(lines))

    with smtplib.SMTP("smtp.gmail.com", 587, timeout=20) as server:
        server.starttls()
        server.login(sender, password)
        server.send_message(msg)

    return True