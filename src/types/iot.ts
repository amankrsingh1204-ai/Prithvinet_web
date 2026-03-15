export interface IoTReading {
  id: string
  device_id: string
  temperature: number
  humidity: number
  noise_db: number
  water_ph: number
  gas_ppm: number
  location: string
  lat: number
  lng: number
  timestamp: string
}

export interface IoTDevice {
  id: string
  name: string
  location: string
  lat: number
  lng: number
  status: "online" | "offline"
}

export interface PersonalIoTAlert {
  type: string
  severity: string
  message: string
}

export interface PersonalIoTLifeExpectancyImpact {
  months_pressure: number
  projected_years: number
  severity: string
  summary: string
}

export interface PersonalIoTHealthFactor {
  name: string
  score: number
}

export interface PersonalIoTHealthImpacts {
  overall_band: string
  factors: PersonalIoTHealthFactor[]
}

export interface PersonalIoTLiveResponse {
  area_name: string
  source: string
  timestamp: string
  reading: {
    temperature: number
    humidity: number
    noise_db: number
    water_ph: number
    gas_ppm: number
    aqi: number
  }
  pin_diagnostics?: {
    pin_map: {
      temperature: string
      humidity: string
      noise_db: string
      water_ph: string
      gas_ppm: string
    }
    raw_values: Record<string, number>
  }
  alerts: PersonalIoTAlert[]
  life_expectancy_impact: PersonalIoTLifeExpectancyImpact
  health_impacts: PersonalIoTHealthImpacts
}
