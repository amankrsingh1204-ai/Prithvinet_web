import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Droplets, Gauge, Thermometer, Volume2, Wind } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

import { D3EnvironmentalLocus } from "./D3EnvironmentalLocus"
import { getIoTHistory, getIoTUnresolvedAlerts, getLatestIoT } from "../services/iotApi"
import type { IoTDevice, IoTReading } from "../types/iot"

type IoTDashboardProps = {
  areaPollutionInfo?: {
    aqi?: number
    noiseLevel?: number
    waterPh?: number
    city?: string
  } | null
  industrialAreas?: Array<{ noise?: number; waterPh?: number }>
}

type AlertItem = {
  id: string
  message: string
  severity: "warning" | "danger"
  source?: "backend" | "local"
}

type IoTBackendAlert = {
  id: number
  location_id: number
  parameter: string
  value: number
  threshold: number
  message: string
  timestamp: string
  resolved: boolean
}

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const normalizeLatest = (raw: any): IoTReading | null => {
  // Backend returns a message object when no rows exist yet.
  if (!raw || typeof raw !== "object" || raw.temperature === undefined) {
    return null
  }

  return {
    id: String(raw.id ?? "latest"),
    device_id: String(raw.device_id ?? "ESP32-001"),
    temperature: toNumber(raw.temperature),
    humidity: toNumber(raw.humidity),
    noise_db: toNumber(raw.noise_db),
    water_ph: toNumber(raw.water_ph, 7),
    gas_ppm: toNumber(raw.gas_ppm),
    location: String(raw.location ?? "Monitoring Station"),
    lat: toNumber(raw.lat, 21.2514),
    lng: toNumber(raw.lng, 81.6296),
    timestamp: String(raw.timestamp ?? new Date().toISOString()),
  }
}

const normalizeHistory = (payload: any): IoTReading[] => {
  if (!Array.isArray(payload)) return []

  return payload.map((row: any, index: number) => ({
    id: String(row.id ?? `hist-${index}`),
    device_id: String(row.device_id ?? "ESP32-001"),
    temperature: toNumber(row.temperature),
    humidity: toNumber(row.humidity),
    noise_db: toNumber(row.noise_db),
    water_ph: toNumber(row.water_ph, 7),
    gas_ppm: toNumber(row.gas_ppm),
    location: String(row.location ?? "Monitoring Station"),
    lat: toNumber(row.lat, 21.2514),
    lng: toNumber(row.lng, 81.6296),
    timestamp: String(row.timestamp ?? new Date().toISOString()),
  }))
}

const statusClass = (value: number, warningAt: number, dangerAt: number) => {
  if (value >= dangerAt) return "text-red-400"
  if (value >= warningAt) return "text-yellow-400"
  return "text-emerald-400"
}

const phClass = (value: number) => {
  if (value < 6.5 || value > 7.5) return "text-red-400"
  return "text-emerald-400"
}

export function IoTDashboard({ areaPollutionInfo, industrialAreas = [] }: IoTDashboardProps) {
  const [latest, setLatest] = useState<IoTReading | null>(null)
  const [history, setHistory] = useState<IoTReading[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefreshAt, setLastRefreshAt] = useState<string>("")
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("ESP32-001")

  const devices = useMemo<IoTDevice[]>(() => {
    if (!latest) return []
    return [
      {
        id: latest.device_id,
        name: "ESP32 Device 1",
        location: latest.location,
        lat: latest.lat,
        lng: latest.lng,
        status: "online",
      },
    ]
  }, [latest])

  const chartData = useMemo(() => {
    // Graph data mapping: timestamp -> X axis, sensor metric -> Y axis.
    return [...history]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((item) => ({
        timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        temperature: item.temperature,
        humidity: item.humidity,
        noise_db: item.noise_db,
        water_ph: item.water_ph,
        gas_ppm: item.gas_ppm,
      }))
  }, [history])

  const combinedAreaStats = useMemo(() => {
    const industryNoise = industrialAreas.length
      ? industrialAreas.reduce((acc, item) => acc + toNumber(item.noise), 0) / industrialAreas.length
      : 0
    const industryPh = industrialAreas.length
      ? industrialAreas.reduce((acc, item) => acc + toNumber(item.waterPh, 7), 0) / industrialAreas.length
      : 7

    return {
      aqi: toNumber(areaPollutionInfo?.aqi),
      noise: latest?.noise_db ?? (areaPollutionInfo?.noiseLevel != null ? toNumber(areaPollutionInfo.noiseLevel) : industryNoise),
      ph: latest?.water_ph ?? (areaPollutionInfo?.waterPh != null ? toNumber(areaPollutionInfo.waterPh, 7) : industryPh),
      temperature: latest?.temperature ?? 0,
      humidity: latest?.humidity ?? 0,
      city: areaPollutionInfo?.city || latest?.location || "Selected Monitoring Area",
    }
  }, [areaPollutionInfo, latest, industrialAreas])

  const loadData = async () => {
    try {
      // Poll both latest and history endpoints required by the dashboard.
      const [latestPayload, historyPayload, unresolvedAlertsPayload] = await Promise.all([
        getLatestIoT(),
        getIoTHistory(),
        getIoTUnresolvedAlerts().catch(() => []),
      ])

      setLatest(normalizeLatest(latestPayload))
      setHistory(normalizeHistory(historyPayload))

      const backendAlerts = Array.isArray(unresolvedAlertsPayload)
        ? (unresolvedAlertsPayload as IoTBackendAlert[]).map((item) => ({
            id: `backend-${item.id}`,
            message: item.message,
            severity: "danger" as const,
            source: "backend" as const,
          }))
        : []

      setAlerts((prev) => {
        const localAlerts = prev.filter((item) => item.source !== "backend")
        return [...backendAlerts, ...localAlerts]
      })

      setLastRefreshAt(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Failed to load IoT dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = window.setInterval(loadData, 5000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!latest) {
      setAlerts([])
      return
    }

    const nextAlerts: AlertItem[] = []

    if (toNumber(areaPollutionInfo?.aqi) > 200) {
      nextAlerts.push({ id: "aqi", message: "High AQI detected in selected area", severity: "danger" })
    }
    if (latest.noise_db > 55) {
      nextAlerts.push({ id: "noise", message: `Noise level high in ${latest.location}`, severity: "danger", source: "local" })
    } else if (latest.noise_db > 45) {
      nextAlerts.push({ id: "noise-warning", message: `Noise crossing compliance limit in ${latest.location}`, severity: "warning", source: "local" })
    }
    if (latest.water_ph < 6.5 || latest.water_ph > 7.5) {
      nextAlerts.push({ id: "ph", message: "Water pH out of compliance range (6.5 - 7.5)", severity: "danger", source: "local" })
    }
    if (latest.gas_ppm > 400) {
      nextAlerts.push({ id: "gas", message: "Gas pollution spike detected", severity: "danger", source: "local" })
    } else if (latest.gas_ppm > 300) {
      nextAlerts.push({ id: "gas-warning", message: "Gas concentration in warning zone", severity: "warning", source: "local" })
    }

    setAlerts((prev) => {
      const backendAlerts = prev.filter((item) => item.source === "backend")
      return [...backendAlerts, ...nextAlerts]
    })
  }, [latest, areaPollutionInfo?.aqi])

  const metricCards = latest
    ? [
        {
          key: "temp",
          title: "Temperature",
          value: `${latest.temperature.toFixed(1)} °C`,
          className: statusClass(latest.temperature, 35, 40),
          icon: Thermometer,
        },
        {
          key: "humidity",
          title: "Humidity",
          value: `${latest.humidity.toFixed(1)} %`,
          className: statusClass(latest.humidity, 70, 85),
          icon: Droplets,
        },
        {
          key: "noise",
          title: "Noise",
          value: `${latest.noise_db.toFixed(1)} dB`,
          className: statusClass(latest.noise_db, 75, 85),
          icon: Volume2,
        },
        {
          key: "ph",
          title: "Water pH",
          value: latest.water_ph.toFixed(2),
          className: phClass(latest.water_ph),
          icon: Gauge,
        },
        {
          key: "gas",
          title: "Gas",
          value: `${latest.gas_ppm.toFixed(1)} ppm`,
          className: statusClass(latest.gas_ppm, 300, 400),
          icon: Wind,
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">IoT Monitoring</h2>
          <p className="text-xs text-slate-400 mt-1">Live ESP32 telemetry, map intelligence, and historical trend analysis.</p>
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 rounded-xl">
          {isLoading ? "Loading IoT data..." : `Live Feed Active${lastRefreshAt ? ` • ${lastRefreshAt}` : ""}`}
        </div>
      </div>

      <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {metricCards.length > 0 ? (
            metricCards.map((card) => (
              <div key={card.key} className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{card.title}</p>
                  <card.icon className="w-4 h-4 text-slate-400" />
                </div>
                <p className={`text-xl font-black ${card.className}`}>{card.value}</p>
              </div>
            ))
          ) : (
            <div className="md:col-span-5 text-sm text-slate-400">Loading IoT data...</div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Area Monitoring Snapshot</h3>
            <p className="text-[11px] text-slate-400">Combined IoT, satellite, and industry metrics</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-black/20 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-bold">Area</p>
              <p className="text-xs font-semibold text-white mt-1 truncate">{combinedAreaStats.city}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-bold">AQI</p>
              <p className={statusClass(combinedAreaStats.aqi, 100, 200)}>{combinedAreaStats.aqi.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-bold">Noise</p>
              <p className={statusClass(combinedAreaStats.noise, 75, 85)}>{combinedAreaStats.noise.toFixed(1)} dB</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-bold">Water pH</p>
              <p className={phClass(combinedAreaStats.ph)}>{combinedAreaStats.ph.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-bold">Temperature</p>
              <p className={statusClass(combinedAreaStats.temperature, 35, 40)}>{combinedAreaStats.temperature.toFixed(1)} C</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-bold">Humidity</p>
              <p className={statusClass(combinedAreaStats.humidity, 70, 85)}>{combinedAreaStats.humidity.toFixed(1)} %</p>
            </div>
          </div>
        </section>

        <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl">
          <h3 className="text-sm font-bold text-white mb-4">Alerts Panel</h3>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-xs text-emerald-400">No active IoT alerts.</p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl p-3 border ${alert.severity === "danger" ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"}`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                    <p className="text-xs font-medium">{alert.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl">
        <h3 className="text-sm font-bold text-white mb-4">Historical Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            { key: "temperature", color: "#f97316", title: "Temperature Trend" },
            { key: "humidity", color: "#22c55e", title: "Humidity Trend" },
            { key: "noise_db", color: "#ef4444", title: "Noise Trend" },
            { key: "water_ph", color: "#06b6d4", title: "Water pH Trend" },
            { key: "gas_ppm", color: "#a855f7", title: "Gas Trend" },
          ].map((chart) => (
            <div key={chart.key} className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">{chart.title}</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 12 }} />
                    <Line type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </section>

      <D3EnvironmentalLocus />

      <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl">
        <h3 className="text-sm font-bold text-white mb-4">Device List</h3>
        <div className="overflow-auto rounded-xl border border-white/5">
          <table className="w-full text-xs">
            <thead className="bg-black/20 text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="text-left p-3">Device ID</th>
                <th className="text-left p-3">Location</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Last Reading</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">Loading IoT data...</td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id} className="border-t border-white/5">
                    <td className="p-3 font-semibold text-white">{device.id}</td>
                    <td className="p-3 text-slate-300">{device.location}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">{device.status}</span>
                    </td>
                    <td className="p-3 text-slate-300">
                      {latest
                        ? `${latest.temperature.toFixed(1)} C / ${latest.humidity.toFixed(1)} % / ${latest.noise_db.toFixed(1)} dB`
                        : "--"}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedDeviceId(device.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
