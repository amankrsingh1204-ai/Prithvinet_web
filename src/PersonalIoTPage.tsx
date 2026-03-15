import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, HeartPulse, Hourglass, RefreshCw, ShieldAlert } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getPersonalLiveIoT, getPersonalLiveIoTWebSocketUrl } from './services/iotApi'
import type { PersonalIoTLiveResponse } from './types/iot'

type TrendPoint = {
  time: string
  aqi: number
  noise: number
  temperature: number
}

const HISTORY_LIMIT = 36

function severityClass(severity: string): string {
  const normalized = severity.toLowerCase()
  if (normalized === 'high' || normalized === 'critical') {
    return 'bg-red-100 text-red-700 border-red-200'
  }
  if (normalized === 'moderate' || normalized === 'medium') {
    return 'bg-amber-100 text-amber-700 border-amber-200'
  }
  return 'bg-emerald-100 text-emerald-700 border-emerald-200'
}

export default function PersonalIoTPage() {
  const [payload, setPayload] = useState<PersonalIoTLiveResponse | null>(null)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [packetAgeMs, setPacketAgeMs] = useState<number>(0)

  const applyPayload = (next: PersonalIoTLiveResponse) => {
    setPayload(next)
    setError(null)

    const timestamp = new Date(next.timestamp)
    const point: TrendPoint = {
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      aqi: next.reading.aqi,
      noise: next.reading.noise_db,
      temperature: next.reading.temperature,
    }

    setTrend((prev) => {
      const merged = [...prev, point]
      return merged.slice(Math.max(0, merged.length - HISTORY_LIMIT))
    })
  }

  const loadData = async () => {
    try {
      setRefreshing(true)
      const next = await getPersonalLiveIoT()
      applyPayload(next)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach personal IoT feed'
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let socket: WebSocket | null = null
    let reconnectTimer: number | null = null
    let keepRunning = true

    const connect = () => {
      if (!keepRunning) {
        return
      }

      setLiveStatus('connecting')
      socket = new WebSocket(getPersonalLiveIoTWebSocketUrl())

      socket.onopen = () => {
        setLiveStatus('connected')
        setLoading(false)
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data?.type === 'personal_live' && data.payload) {
            applyPayload(data.payload as PersonalIoTLiveResponse)
            setError(null)
            setLoading(false)
            return
          }
          if (data?.type === 'error' && typeof data.detail === 'string') {
            setError(data.detail)
          }
        } catch {
          setError('Invalid WebSocket payload from backend')
        }
      }

      socket.onerror = () => {
        setLiveStatus('disconnected')
      }

      socket.onclose = () => {
        setLiveStatus('disconnected')
        if (!keepRunning) {
          return
        }
        reconnectTimer = window.setTimeout(connect, 2500)
      }
    }

    connect()

    return () => {
      keepRunning = false
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer)
      }
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!payload?.timestamp) {
        return
      }
      setPacketAgeMs(Math.max(0, Date.now() - new Date(payload.timestamp).getTime()))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [payload?.timestamp])

  const healthChartData = useMemo(() => payload?.health_impacts.factors || [], [payload])
  const rawPins = useMemo(() => payload?.pin_diagnostics?.raw_values || {}, [payload])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50 to-orange-100 text-stone-700">
        <div className="rounded-2xl border border-stone-200 bg-white/70 px-6 py-5 shadow-lg backdrop-blur-xl">
          Loading personal IoT live data...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-orange-100 text-stone-800">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 rounded-2xl border border-white/70 bg-white/55 p-5 shadow-xl backdrop-blur-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Personal Area IoT Live Monitor</h1>
              <p className="mt-1 text-sm text-stone-600">
                {payload?.area_name || 'Personal Area'} | Source: {payload?.source || 'Blynk Cloud'}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Last update: {payload ? new Date(payload.timestamp).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                  liveStatus === 'connected'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : liveStatus === 'connecting'
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                Stream: {liveStatus}
              </span>
              <button
                onClick={() => loadData()}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-white"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Pull latest once
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl border border-white/70 bg-white/55 p-4 shadow-lg backdrop-blur-xl xl:col-span-1">
            <div className="text-xs uppercase text-stone-500">Temperature</div>
            <div className="mt-2 text-2xl font-semibold">{payload?.reading.temperature.toFixed(1)} C</div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/55 p-4 shadow-lg backdrop-blur-xl xl:col-span-1">
            <div className="text-xs uppercase text-stone-500">Humidity</div>
            <div className="mt-2 text-2xl font-semibold">{payload?.reading.humidity.toFixed(1)} %</div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/55 p-4 shadow-lg backdrop-blur-xl xl:col-span-1">
            <div className="text-xs uppercase text-stone-500">Noise</div>
            <div className="mt-2 text-2xl font-semibold">{payload?.reading.noise_db.toFixed(1)} dB</div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/55 p-4 shadow-lg backdrop-blur-xl xl:col-span-1">
            <div className="text-xs uppercase text-stone-500">Water pH</div>
            <div className="mt-2 text-2xl font-semibold">{payload?.reading.water_ph.toFixed(2)}</div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/55 p-4 shadow-lg backdrop-blur-xl xl:col-span-1">
            <div className="text-xs uppercase text-stone-500">Gas</div>
            <div className="mt-2 text-2xl font-semibold">{payload?.reading.gas_ppm.toFixed(0)} ppm</div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/55 p-4 shadow-lg backdrop-blur-xl xl:col-span-1">
            <div className="text-xs uppercase text-stone-500">AQI</div>
            <div className="mt-2 text-2xl font-semibold">{payload?.reading.aqi.toFixed(0)}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-white/55 p-5 shadow-lg backdrop-blur-xl xl:col-span-1">
            <div className="mb-3 flex items-center gap-2 text-base font-semibold text-stone-800">
              <Hourglass size={18} />
              Life Expectancy Impact
            </div>
            <div className="text-3xl font-semibold">{payload?.life_expectancy_impact.months_pressure || 0} months</div>
            <p className="mt-2 text-sm text-stone-700">{payload?.life_expectancy_impact.summary || 'No data yet.'}</p>
            <p className="mt-2 text-sm text-stone-600">
              Projected longevity under current trend: {payload?.life_expectancy_impact.projected_years || 0} years
            </p>
            <span
              className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${severityClass(
                payload?.life_expectancy_impact.severity || 'low',
              )}`}
            >
              Severity: {payload?.life_expectancy_impact.severity || 'Low'}
            </span>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/55 p-5 shadow-lg backdrop-blur-xl xl:col-span-1">
            <div className="mb-3 flex items-center gap-2 text-base font-semibold text-stone-800">
              <HeartPulse size={18} />
              Health Impacts
            </div>
            <div className="mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold text-stone-700">
              Overall: {payload?.health_impacts.overall_band || 'Low'}
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#9a3412" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/55 p-5 shadow-lg backdrop-blur-xl xl:col-span-1">
            <div className="mb-3 flex items-center gap-2 text-base font-semibold text-stone-800">
              <ShieldAlert size={18} />
              Active Alerts
            </div>
            <div className="space-y-2">
              {(payload?.alerts || []).length === 0 ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  No active alerts for this refresh cycle.
                </div>
              ) : (
                (payload?.alerts || []).map((alert, index) => (
                  <div key={`${alert.type}-${index}`} className="rounded-lg border border-stone-200 bg-white/70 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-medium">
                        <AlertTriangle size={14} className="text-amber-600" />
                        {alert.type}
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${severityClass(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-stone-700">{alert.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/70 bg-white/55 p-5 shadow-lg backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2 text-base font-semibold text-stone-800">
            <Activity size={18} />
            Real-time Exposure Trend
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="aqi" stroke="#dc2626" strokeWidth={2} dot={false} name="AQI" />
                <Line yAxisId="left" type="monotone" dataKey="noise" stroke="#b45309" strokeWidth={2} dot={false} name="Noise (dB)" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#0f766e"
                  strokeWidth={2}
                  dot={false}
                  name="Temperature (C)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/70 bg-white/55 p-5 shadow-lg backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-stone-800">Live Device Diagnostics</h2>
              <p className="text-xs text-stone-600">Raw Blynk virtual pin values from the active device mapping.</p>
            </div>
            <div className="rounded-full border border-stone-300 bg-white/70 px-3 py-1 text-xs font-semibold text-stone-700">
              Packet age: {(packetAgeMs / 1000).toFixed(1)}s
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {Object.entries(payload?.pin_diagnostics?.pin_map || {}).map(([metric, pin]) => (
              <div key={metric} className="rounded-xl border border-stone-200 bg-white/70 p-3">
                <p className="text-xs uppercase text-stone-500">{metric.replace('_', ' ')}</p>
                <p className="mt-1 text-sm font-medium text-stone-700">Pin: {pin}</p>
                <p className="mt-2 text-2xl font-semibold text-stone-900">{rawPins[String(pin).toLowerCase()] ?? 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/70 bg-white/55 p-4 text-sm text-stone-700 shadow-lg backdrop-blur-xl">
          <p className="font-medium">How to access this page</p>
          <p className="mt-1">
            Use the route <span className="font-semibold">/iot-personal</span> to open this dedicated personal area monitoring view.
          </p>
        </div>
      </div>
    </div>
  )
}
