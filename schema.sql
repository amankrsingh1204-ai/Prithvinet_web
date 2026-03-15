-- PrithviNet Core Schema (PostgreSQL with PostGIS)

-- Enable PostGIS extension
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Users and RBAC
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'REGIONAL_OFFICER', 'INDUSTRY_USER', 'CITIZEN')),
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organizations (Regional Offices and Industries)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('REGIONAL_OFFICE', 'INDUSTRY')),
    address TEXT,
    location GEOGRAPHY(POINT, 4324), -- Geo-tagging
    contact_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Monitoring Units / Sensors
CREATE TABLE sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    parameter TEXT NOT NULL, -- 'AIR_AQI', 'WATER_PH', 'NOISE_DB', 'TEMP_C'
    unit TEXT NOT NULL, -- 'ppm', 'dB', '°C', etc.
    min_threshold FLOAT,
    max_threshold FLOAT,
    location GEOGRAPHY(POINT, 4326),
    status TEXT DEFAULT 'ACTIVE',
    last_reading FLOAT,
    last_reading_at TIMESTAMP WITH TIME ZONE
);

-- Historical Logs / Time Series Data
CREATE TABLE sensor_logs (
    id BIGSERIAL PRIMARY KEY,
    sensor_id UUID REFERENCES sensors(id),
    value FLOAT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_simulated BOOLEAN DEFAULT FALSE
);

-- Alerts and Escalations
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID REFERENCES sensors(id),
    value FLOAT NOT NULL,
    threshold_exceeded FLOAT NOT NULL,
    severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status TEXT DEFAULT 'OPEN', -- 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'
    escalation_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- AI Forecasts
CREATE TABLE forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID REFERENCES sensors(id),
    forecast_value FLOAT NOT NULL,
    uncertainty_range_low FLOAT,
    uncertainty_range_high FLOAT,
    target_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Personal Area IoT (Blynk) configuration
CREATE TABLE IF NOT EXISTS iot_blynk_configs (
    id INTEGER PRIMARY KEY,
    area_name TEXT NOT NULL DEFAULT 'Personal Area',
    auth_token TEXT NOT NULL,
    template_id TEXT,
    template_name TEXT,
    pin_map JSONB NOT NULL DEFAULT '{"temperature":"v0","humidity":"v1","noise_db":"v2","water_ph":"v3","gas_ppm":"v4"}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
