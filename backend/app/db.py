from __future__ import annotations

import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor

BACKEND_DIR = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = BACKEND_DIR.parent

# Support running backend from either workspace root or backend folder.
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(WORKSPACE_ROOT / ".env")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:aman1204@localhost:5432/prithvinet",
)


def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    try:

        # STATES
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS states (
                id SERIAL PRIMARY KEY,
                state_name TEXT NOT NULL,
                super_admin_email TEXT UNIQUE NOT NULL
            );
            """
        )

        # USERS
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL,
                password TEXT NOT NULL,
                state_id INTEGER,
                district_name TEXT,
                team_zone TEXT
            );
            """
        )

        # INDUSTRIES
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS industries (
                id SERIAL PRIMARY KEY,
                industry_email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                state_name TEXT,
                district_name TEXT,
                zone TEXT,
                monitored_by TEXT
            );
            """
        )

        # SENSORS
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS sensors (
                id TEXT PRIMARY KEY,
                name TEXT,
                parameter TEXT,
                unit TEXT,
                max_threshold REAL,
                lat REAL,
                lng REAL
            );
            """
        )

        # SENSOR LOGS
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS sensor_logs (
                id SERIAL PRIMARY KEY,
                sensor_id TEXT,
                value REAL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        )

        # ALERTS
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS alerts (
                id SERIAL PRIMARY KEY,
                sensor_id TEXT,
                value REAL,
                severity TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        )

        # Extend existing alerts table for threshold/email alert workflow.
        cur.execute("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS type TEXT;")
        cur.execute("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS message TEXT;")
        cur.execute("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS location TEXT;")

        # ALERT SUBSCRIPTIONS
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS alert_subscriptions (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """
        )

        # AQI CACHE
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS aqi_cache (
                city TEXT PRIMARY KEY,
                aqi INTEGER NOT NULL,
                aqi_status TEXT NOT NULL,
                pm25 REAL NOT NULL DEFAULT 0,
                pm10 REAL NOT NULL DEFAULT 0,
                fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """
        )

        # BLYNK PERSONAL IOT CONFIG
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS iot_blynk_configs (
                id INTEGER PRIMARY KEY,
                area_name TEXT NOT NULL DEFAULT 'Personal Area',
                auth_token TEXT NOT NULL,
                template_id TEXT,
                template_name TEXT,
                pin_map JSONB NOT NULL DEFAULT
                    '{"temperature":"v0","humidity":"v1","noise_db":"v2","water_ph":"v3","gas_ppm":"v4"}'::jsonb,
                active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """
        )

        cur.execute(
            """
            INSERT INTO iot_blynk_configs (
                id,
                area_name,
                auth_token,
                template_id,
                template_name,
                pin_map,
                active,
                updated_at
            )
            VALUES (
                1,
                'Personal Area',
                'NVUmX2giMGcVOh-z4cziR_U_9BiE89ml',
                'TPL3gYSH4YZo',
                'PrithviNetIoT',
                '{"temperature":"v0","humidity":"v1","noise_db":"v2","water_ph":"v3","gas_ppm":"v4"}'::jsonb,
                TRUE,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                auth_token = EXCLUDED.auth_token,
                template_id = EXCLUDED.template_id,
                template_name = EXCLUDED.template_name,
                pin_map = EXCLUDED.pin_map,
                active = EXCLUDED.active,
                updated_at = CURRENT_TIMESTAMP;
            """
        )

        conn.commit()

    finally:
        cur.close()
        conn.close()