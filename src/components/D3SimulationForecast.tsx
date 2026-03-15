import { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"

import API_BASE from "../config/api"

type SimulatorControls = {
  industrialGrowth: number
  trafficDensity: number
  wasteManagement: number
  greenCover: number
}

type SimulationResult = {
  aqi: number
  noise: number
  ph: number
  risk: "Low" | "Moderate" | "High" | "Critical"
  summary: string
}

type HistoryRow = {
  noise_db: number
  water_ph: number
  gas_ppm: number
  timestamp: string
}

type MetricKey = "aqi" | "noise" | "ph"

type SeriesPoint = {
  timestamp: Date
  value: number
  kind: "history" | "future"
}

type Props = {
  controls: SimulatorControls
  simulationResult: SimulationResult | null
}

const POLL_MS = 5000
const TRAIL_LIMIT = 20
const CHART_HEIGHT = 220
const MARGIN = { top: 20, right: 20, bottom: 28, left: 44 }

const toNumber = (value: unknown, fallback: number) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const normalizeHistory = (payload: unknown): HistoryRow[] => {
  if (!Array.isArray(payload)) return []

  return payload
    .map((row) => {
      if (!row || typeof row !== "object") return null
      const raw = row as Record<string, unknown>
      const ts = typeof raw.timestamp === "string" ? raw.timestamp : ""
      const parsed = new Date(ts)
      if (!ts || Number.isNaN(parsed.getTime())) return null

      return {
        noise_db: toNumber(raw.noise_db, 0),
        water_ph: toNumber(raw.water_ph, 7),
        gas_ppm: toNumber(raw.gas_ppm, 0),
        timestamp: ts,
      }
    })
    .filter((row): row is HistoryRow => row !== null)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

const averageSlope = (values: number[]) => {
  if (values.length < 2) return 0
  const diffs: number[] = []
  for (let i = 1; i < values.length; i += 1) {
    diffs.push(values[i] - values[i - 1])
  }
  return d3.mean(diffs) ?? 0
}

const metricLabel = (key: MetricKey) => {
  if (key === "aqi") return "AQI Locus Forecast"
  if (key === "noise") return "Noise Locus Forecast"
  return "Water pH Locus Forecast"
}

const metricColor = (key: MetricKey) => {
  if (key === "aqi") return "#f97316"
  if (key === "noise") return "#a855f7"
  return "#0ea5e9"
}

const metricUnit = (key: MetricKey) => {
  if (key === "aqi") return "AQI"
  if (key === "noise") return "dB"
  return "pH"
}

const buildSeries = (rows: HistoryRow[], controls: SimulatorControls, metric: MetricKey): SeriesPoint[] => {
  if (rows.length === 0) return []

  const history = rows.map((row) => {
    const timestamp = new Date(row.timestamp)
    if (metric === "aqi") {
      return { timestamp, value: clamp(row.gas_ppm * 1.8, 0, 500), kind: "history" as const }
    }
    if (metric === "noise") {
      return { timestamp, value: clamp(row.noise_db, 20, 130), kind: "history" as const }
    }
    return { timestamp, value: clamp(row.water_ph, 0, 14), kind: "history" as const }
  })

  const recent = history.slice(-8)
  const slope = averageSlope(recent.map((point) => point.value))
  const last = history[history.length - 1]

  const industrialPressure = (controls.industrialGrowth + controls.trafficDensity) / 2
  const mitigation = (controls.wasteManagement + controls.greenCover) / 2

  const futureStepBias =
    metric === "aqi"
      ? ((industrialPressure - 50) * 0.12) - ((mitigation - 50) * 0.08)
      : metric === "noise"
        ? ((controls.trafficDensity - 50) * 0.07) + ((controls.industrialGrowth - 50) * 0.03) - ((controls.greenCover - 50) * 0.02)
        : -((controls.industrialGrowth - 50) * 0.0018) + ((controls.wasteManagement - 50) * 0.0022) + ((controls.greenCover - 50) * 0.001)

  const minuteGap = 5
  const futureSteps = 10

  const future: SeriesPoint[] = []
  for (let i = 1; i <= futureSteps; i += 1) {
    const timestamp = new Date(last.timestamp.getTime() + i * minuteGap * 60_000)
    const projected = last.value + (slope * i) + (futureStepBias * i * 0.7)

    const value =
      metric === "aqi"
        ? clamp(projected, 0, 500)
        : metric === "noise"
          ? clamp(projected, 20, 130)
          : clamp(projected, 0, 14)

    future.push({ timestamp, value: Number(value.toFixed(metric === "ph" ? 2 : 1)), kind: "future" })
  }

  return [...history, ...future]
}

const drawLocusMetric = (
  host: HTMLDivElement,
  points: SeriesPoint[],
  key: MetricKey,
  onCleanup: (cleanup: () => void) => void,
) => {
  host.innerHTML = ""
  if (points.length === 0) return

  const width = Math.max(340, host.clientWidth)
  const height = CHART_HEIGHT
  const innerWidth = width - MARGIN.left - MARGIN.right
  const innerHeight = height - MARGIN.top - MARGIN.bottom

  const svg = d3
    .select(host)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("width", "100%")
    .style("height", `${height}px`)

  const plot = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`)

  const x = d3
    .scaleTime()
    .domain(d3.extent(points, (d) => d.timestamp) as [Date, Date])
    .range([0, innerWidth])

  const yExtent = d3.extent(points, (d) => d.value)
  const y = d3
    .scaleLinear()
    .domain([(yExtent[0] ?? 0) - 1, (yExtent[1] ?? 10) + 1])
    .nice()
    .range([innerHeight, 0])

  plot
    .append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(
      d3
        .axisBottom<Date>(x)
        .ticks(4)
        .tickFormat((value) => d3.timeFormat("%H:%M")(value as Date)),
    )
    .call((g) => g.selectAll("text").attr("fill", "#94a3b8").attr("font-size", 10))
    .call((g) => g.selectAll("line,path").attr("stroke", "rgba(148,163,184,0.35)"))

  plot
    .append("g")
    .call(d3.axisLeft(y).ticks(4))
    .call((g) => g.selectAll("text").attr("fill", "#94a3b8").attr("font-size", 10))
    .call((g) => g.selectAll("line,path").attr("stroke", "rgba(148,163,184,0.35)"))

  const line = d3
    .line<SeriesPoint>()
    .x((d) => x(d.timestamp))
    .y((d) => y(d.value))
    .curve(d3.curveCatmullRom.alpha(0.5))

  const history = points.filter((d) => d.kind === "history")
  const future = points.filter((d) => d.kind === "future")

  const color = metricColor(key)

  plot
    .append("path")
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2.2)
    .attr("opacity", 0.9)
    .attr("d", line(history))

  if (future.length > 0) {
    plot
      .append("path")
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6 5")
      .attr("opacity", 0.85)
      .attr("d", line([history[history.length - 1], ...future]))
  }

  const title = svg.append("g").attr("transform", `translate(${MARGIN.left},14)`)
  title.append("text").text(metricLabel(key)).attr("fill", "#e2e8f0").attr("font-size", 11).attr("font-weight", 700)
  title.append("text").text(metricUnit(key)).attr("x", innerWidth - 30).attr("fill", "#64748b").attr("font-size", 10)

  const locusPath = plot
    .append("path")
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2.8)
    .attr("opacity", 0.8)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")

  const node = plot
    .append("circle")
    .attr("r", 6)
    .attr("fill", color)
    .attr("stroke", "rgba(255,255,255,0.9)")
    .attr("stroke-width", 1.2)

  const locusDots = plot.append("g")
  const trail: Array<{ x: number; y: number }> = []

  let idx = 0
  const timer = d3.interval(() => {
    const point = points[idx]
    if (!point) return

    const px = x(point.timestamp)
    const py = y(point.value)

    node.attr("cx", px).attr("cy", py)

    trail.push({ x: px, y: py })
    if (trail.length > TRAIL_LIMIT) {
      trail.shift()
    }

    const locusLine = d3
      .line<{ x: number; y: number }>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveBasis)

    locusPath.attr("d", locusLine(trail))

    const dots = locusDots.selectAll<SVGCircleElement, { x: number; y: number }>("circle").data(trail)
    dots.exit().remove()
    dots
      .enter()
      .append("circle")
      .attr("r", 2)
      .merge(dots)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("fill", color)
      .attr("opacity", (_d, i) => Math.max(0.12, i / Math.max(1, trail.length)))

    idx = (idx + 1) % points.length
  }, 240)

  onCleanup(() => {
    timer.stop()
    svg.remove()
  })
}

const drawControlBarChart = (host: HTMLDivElement, controls: SimulatorControls) => {
  host.innerHTML = ""

  const data = [
    { key: "Industrial", value: controls.industrialGrowth, color: "#f97316" },
    { key: "Traffic", value: controls.trafficDensity, color: "#a855f7" },
    { key: "Waste", value: controls.wasteManagement, color: "#22c55e" },
    { key: "Green", value: controls.greenCover, color: "#06b6d4" },
  ]

  const width = Math.max(300, host.clientWidth)
  const height = 190
  const innerWidth = width - 36

  const svg = d3
    .select(host)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("width", "100%")
    .style("height", `${height}px`)

  svg.append("text").text("Control Pressure Map").attr("x", 18).attr("y", 18).attr("fill", "#e2e8f0").attr("font-size", 11).attr("font-weight", 700)

  const y = d3.scaleBand().domain(data.map((d) => d.key)).range([40, height - 14]).padding(0.28)
  const x = d3.scaleLinear().domain([0, 100]).range([0, innerWidth - 90])

  const group = svg.append("g").attr("transform", "translate(18,0)")

  group
    .selectAll("rect.track")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "track")
    .attr("x", 0)
    .attr("y", (d) => y(d.key) ?? 0)
    .attr("rx", 6)
    .attr("height", y.bandwidth())
    .attr("width", innerWidth - 90)
    .attr("fill", "rgba(148,163,184,0.16)")

  group
    .selectAll("rect.fill")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "fill")
    .attr("x", 0)
    .attr("y", (d) => y(d.key) ?? 0)
    .attr("rx", 6)
    .attr("height", y.bandwidth())
    .attr("width", (d) => x(d.value))
    .attr("fill", (d) => d.color)
    .attr("opacity", 0.85)

  group
    .selectAll("text.label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", 4)
    .attr("y", (d) => (y(d.key) ?? 0) + y.bandwidth() / 2 + 4)
    .attr("fill", "#cbd5e1")
    .attr("font-size", 10)
    .text((d) => d.key)

  group
    .selectAll("text.value")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "value")
    .attr("x", innerWidth - 64)
    .attr("y", (d) => (y(d.key) ?? 0) + y.bandwidth() / 2 + 4)
    .attr("fill", "#94a3b8")
    .attr("font-size", 10)
    .text((d) => `${d.value}%`)
}

const drawEffectChart = (host: HTMLDivElement, rows: HistoryRow[], simulationResult: SimulationResult | null) => {
  host.innerHTML = ""

  const latest = rows[rows.length - 1]
  const baselineAqi = latest ? clamp(latest.gas_ppm * 1.8, 0, 500) : 140
  const baselineNoise = latest ? clamp(latest.noise_db, 20, 130) : 68
  const baselinePh = latest ? clamp(latest.water_ph, 0, 14) : 7.2

  const finalAqi = simulationResult?.aqi ?? baselineAqi
  const finalNoise = simulationResult?.noise ?? baselineNoise
  const finalPh = simulationResult?.ph ?? baselinePh

  const data = [
    { key: "AQI", before: baselineAqi, after: finalAqi, color: "#f97316" },
    { key: "Noise", before: baselineNoise, after: finalNoise, color: "#a855f7" },
    { key: "pH", before: baselinePh, after: finalPh, color: "#0ea5e9" },
  ]

  const width = Math.max(300, host.clientWidth)
  const height = 190

  const svg = d3
    .select(host)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("width", "100%")
    .style("height", `${height}px`)

  svg.append("text").text("Scenario Effect Delta").attr("x", 18).attr("y", 18).attr("fill", "#e2e8f0").attr("font-size", 11).attr("font-weight", 700)

  const group = svg.append("g").attr("transform", "translate(18,34)")
  const blockWidth = (width - 60) / data.length

  data.forEach((item, idx) => {
    const x = idx * blockWidth
    group
      .append("text")
      .text(item.key)
      .attr("x", x + 6)
      .attr("y", 10)
      .attr("fill", "#94a3b8")
      .attr("font-size", 10)

    group
      .append("text")
      .text(`Past ${item.before.toFixed(item.key === "pH" ? 2 : 1)}`)
      .attr("x", x + 6)
      .attr("y", 34)
      .attr("fill", "#64748b")
      .attr("font-size", 9)

    group
      .append("text")
      .text(`Future ${item.after.toFixed(item.key === "pH" ? 2 : 1)}`)
      .attr("x", x + 6)
      .attr("y", 50)
      .attr("fill", item.color)
      .attr("font-size", 10)
      .attr("font-weight", 700)

    const delta = item.after - item.before
    const sign = delta > 0 ? "+" : ""

    group
      .append("text")
      .text(`Delta ${sign}${delta.toFixed(item.key === "pH" ? 2 : 1)}`)
      .attr("x", x + 6)
      .attr("y", 66)
      .attr("fill", delta >= 0 ? "#fca5a5" : "#86efac")
      .attr("font-size", 9)

    group
      .append("line")
      .attr("x1", x + 6)
      .attr("x2", x + blockWidth - 16)
      .attr("y1", 84)
      .attr("y2", 84)
      .attr("stroke", "rgba(148,163,184,0.24)")

    const magnitude = Math.min(1, Math.abs(delta) / (item.key === "pH" ? 1.5 : item.key === "Noise" ? 20 : 120))

    group
      .append("rect")
      .attr("x", x + 6)
      .attr("y", 94)
      .attr("rx", 5)
      .attr("width", (blockWidth - 22) * magnitude)
      .attr("height", 12)
      .attr("fill", item.color)
      .attr("opacity", 0.8)
  })
}

export function D3SimulationForecast({ controls, simulationResult }: Props) {
  const [rows, setRows] = useState<HistoryRow[]>([])

  const metricHosts = {
    aqi: useRef<HTMLDivElement | null>(null),
    noise: useRef<HTMLDivElement | null>(null),
    ph: useRef<HTMLDivElement | null>(null),
  }

  const controlsHost = useRef<HTMLDivElement | null>(null)
  const effectHost = useRef<HTMLDivElement | null>(null)
  const cleanupRefs = useRef<Array<() => void>>([])

  useEffect(() => {
    let mounted = true

    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_BASE}/iot/history?limit=100`)
        if (!response.ok) return
        const payload = await response.json()
        if (!mounted) return
        setRows(normalizeHistory(payload))
      } catch {
        // Keep last successful history snapshot on transient network failure.
      }
    }

    fetchHistory()
    const id = window.setInterval(fetchHistory, POLL_MS)

    return () => {
      mounted = false
      window.clearInterval(id)
    }
  }, [])

  const series = useMemo(() => {
    return {
      aqi: buildSeries(rows, controls, "aqi"),
      noise: buildSeries(rows, controls, "noise"),
      ph: buildSeries(rows, controls, "ph"),
    }
  }, [rows, controls])

  useEffect(() => {
    cleanupRefs.current.forEach((cleanup) => cleanup())
    cleanupRefs.current = []

    if (metricHosts.aqi.current) {
      drawLocusMetric(metricHosts.aqi.current, series.aqi, "aqi", (cleanup) => cleanupRefs.current.push(cleanup))
    }
    if (metricHosts.noise.current) {
      drawLocusMetric(metricHosts.noise.current, series.noise, "noise", (cleanup) => cleanupRefs.current.push(cleanup))
    }
    if (metricHosts.ph.current) {
      drawLocusMetric(metricHosts.ph.current, series.ph, "ph", (cleanup) => cleanupRefs.current.push(cleanup))
    }

    if (controlsHost.current) {
      drawControlBarChart(controlsHost.current, controls)
    }
    if (effectHost.current) {
      drawEffectChart(effectHost.current, rows, simulationResult)
    }

    return () => {
      cleanupRefs.current.forEach((cleanup) => cleanup())
      cleanupRefs.current = []
    }
  }, [series, controls, rows, simulationResult])

  return (
    <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white">Locus Trace Forecast Simulation</h4>
        <p className="text-[11px] text-slate-400">Past telemetry + future scenario projection (updated every 5s)</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <div ref={metricHosts.aqi} className="w-full" />
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <div ref={metricHosts.noise} className="w-full" />
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <div ref={metricHosts.ph} className="w-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <div ref={controlsHost} className="w-full" />
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <div ref={effectHost} className="w-full" />
        </div>
      </div>
    </section>
  )
}
