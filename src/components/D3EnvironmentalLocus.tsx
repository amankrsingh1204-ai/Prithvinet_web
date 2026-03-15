import { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"

import API_BASE from "../config/api"

type MetricKey = "aqi" | "noise_db" | "water_ph"

type HistoryRow = {
  temperature: number
  humidity: number
  noise_db: number
  water_ph: number
  gas_ppm: number
  timestamp: string
}

type MetricPoint = {
  id: string
  timestamp: Date
  value: number
}

type SimNode = MetricPoint & {
  x: number
  y: number
  vx: number
  vy: number
  isLatest: boolean
}

type ChartRuntime = {
  container: HTMLDivElement
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
  plotLayer: d3.Selection<SVGGElement, unknown, null, undefined>
  axisBottom: d3.Selection<SVGGElement, unknown, null, undefined>
  axisLeft: d3.Selection<SVGGElement, unknown, null, undefined>
  trendPath: d3.Selection<SVGPathElement, unknown, null, undefined>
  locusPath: d3.Selection<SVGPathElement, unknown, null, undefined>
  locusDotsLayer: d3.Selection<SVGGElement, unknown, null, undefined>
  nodesLayer: d3.Selection<SVGGElement, unknown, null, undefined>
  simulation: d3.Simulation<SimNode, undefined>
  trail: Array<{ x: number; y: number }>
  width: number
  height: number
}

const MARGINS = { top: 20, right: 20, bottom: 26, left: 44 }
const CHART_HEIGHT = 230
const TRAIL_LIMIT = 20
const POLL_INTERVAL_MS = 5000

const METRICS: Array<{
  key: MetricKey
  title: string
  color: string
  unit: string
  valueOf: (row: HistoryRow) => number
}> = [
  {
    key: "aqi",
    title: "AQI Trajectory",
    color: "#f97316",
    unit: "AQI",
    // AQI is approximated from gas concentration so the graph can be derived from /iot/history.
    valueOf: (row) => Math.max(0, Math.min(500, Number(row.gas_ppm ?? 0) * 1.8)),
  },
  {
    key: "noise_db",
    title: "Noise Trajectory",
    color: "#a855f7",
    unit: "dB",
    valueOf: (row) => Number(row.noise_db ?? 0),
  },
  {
    key: "water_ph",
    title: "Water pH Trajectory",
    color: "#0ea5e9",
    unit: "pH",
    valueOf: (row) => Number(row.water_ph ?? 7),
  },
]

const toValidDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const normalizeHistory = (payload: unknown): HistoryRow[] => {
  if (!Array.isArray(payload)) return []

  return payload
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const raw = item as Record<string, unknown>
      const ts = typeof raw.timestamp === "string" ? raw.timestamp : ""
      if (!toValidDate(ts)) return null
      return {
        temperature: Number(raw.temperature ?? 0),
        humidity: Number(raw.humidity ?? 0),
        noise_db: Number(raw.noise_db ?? 0),
        water_ph: Number(raw.water_ph ?? 7),
        gas_ppm: Number(raw.gas_ppm ?? 0),
        timestamp: ts,
      }
    })
    .filter((item): item is HistoryRow => item !== null)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

const pointsForMetric = (rows: HistoryRow[], metric: (row: HistoryRow) => number): MetricPoint[] => {
  return rows.map((row, idx) => ({
    id: `${row.timestamp}-${idx}`,
    timestamp: new Date(row.timestamp),
    value: metric(row),
  }))
}

const createRuntime = (container: HTMLDivElement): ChartRuntime => {
  const width = Math.max(360, container.clientWidth)

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", CHART_HEIGHT)
    .attr("viewBox", `0 0 ${width} ${CHART_HEIGHT}`)
    .style("width", "100%")
    .style("height", `${CHART_HEIGHT}px`)

  const plotLayer = svg.append("g")
  const axisBottom = svg.append("g")
  const axisLeft = svg.append("g")

  const trendPath = plotLayer
    .append("path")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("opacity", 0.85)

  const locusPath = plotLayer
    .append("path")
    .attr("fill", "none")
    .attr("stroke-width", 2.5)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")

  const locusDotsLayer = plotLayer.append("g")
  const nodesLayer = plotLayer.append("g")

  const simulation = d3
    .forceSimulation<SimNode>([])
    .alphaMin(0.02)
    .force("collision", d3.forceCollide<SimNode>(6))

  return {
    container,
    svg,
    plotLayer,
    axisBottom,
    axisLeft,
    trendPath,
    locusPath,
    locusDotsLayer,
    nodesLayer,
    simulation,
    trail: [],
    width,
    height: CHART_HEIGHT,
  }
}

const updateRuntime = (
  runtime: ChartRuntime,
  points: MetricPoint[],
  color: string,
) => {
  const width = Math.max(360, runtime.container.clientWidth)
  runtime.width = width

  runtime.svg
    .attr("width", width)
    .attr("viewBox", `0 0 ${width} ${runtime.height}`)

  const innerWidth = width - MARGINS.left - MARGINS.right
  const innerHeight = runtime.height - MARGINS.top - MARGINS.bottom

  runtime.plotLayer.attr("transform", `translate(${MARGINS.left},${MARGINS.top})`)
  runtime.axisBottom.attr("transform", `translate(${MARGINS.left},${MARGINS.top + innerHeight})`)
  runtime.axisLeft.attr("transform", `translate(${MARGINS.left},${MARGINS.top})`)

  if (points.length === 0) {
    runtime.trendPath.attr("d", null)
    runtime.locusPath.attr("d", null)
    runtime.nodesLayer.selectAll("circle").remove()
    runtime.locusDotsLayer.selectAll("circle").remove()
    return
  }

  const xDomain = d3.extent(points, (d) => d.timestamp) as [Date, Date]
  const yExtent = d3.extent(points, (d) => d.value)
  const yMin = (yExtent[0] ?? 0) - 2
  const yMax = (yExtent[1] ?? 10) + 2

  const xScale = d3.scaleTime().domain(xDomain).range([0, innerWidth])
  const yScale = d3.scaleLinear().domain([yMin, yMax]).nice().range([innerHeight, 0])

  runtime.axisBottom
    .call(
      d3
        .axisBottom<Date>(xScale)
        .ticks(4)
        .tickFormat((value) => d3.timeFormat("%H:%M")(value as Date)),
    )
    .call((g) => g.selectAll("text").attr("fill", "#94a3b8").attr("font-size", 10))
    .call((g) => g.selectAll("line,path").attr("stroke", "rgba(148,163,184,0.35)"))

  runtime.axisLeft
    .call(d3.axisLeft(yScale).ticks(4))
    .call((g) => g.selectAll("text").attr("fill", "#94a3b8").attr("font-size", 10))
    .call((g) => g.selectAll("line,path").attr("stroke", "rgba(148,163,184,0.35)"))

  const line = d3
    .line<MetricPoint>()
    .x((d) => xScale(d.timestamp))
    .y((d) => yScale(d.value))
    .curve(d3.curveCatmullRom.alpha(0.5))

  runtime.trendPath.attr("stroke", color).attr("d", line(points))

  const latestId = points[points.length - 1]?.id
  const nodes: SimNode[] = points.map((point) => ({
    ...point,
    x: xScale(point.timestamp),
    y: yScale(point.value),
    vx: 0,
    vy: 0,
    isLatest: point.id === latestId,
  }))

  runtime.simulation
    .nodes(nodes)
    .force("x", d3.forceX<SimNode>((d) => xScale(d.timestamp)).strength(0.5))
    .force("y", d3.forceY<SimNode>((d) => yScale(d.value)).strength(1))
    .alpha(0.9)
    .restart()

  const nodeSelection = runtime.nodesLayer
    .selectAll<SVGCircleElement, SimNode>("circle")
    .data(nodes, (d) => d.id)

  nodeSelection.exit().remove()

  nodeSelection
    .enter()
    .append("circle")
    .attr("r", (d) => (d.isLatest ? 6 : 3))
    .attr("fill", (d) => (d.isLatest ? color : "rgba(148,163,184,0.55)"))
    .attr("stroke", (d) => (d.isLatest ? "rgba(255,255,255,0.9)" : "none"))
    .attr("stroke-width", 1.25)
    .merge(nodeSelection as any)

  runtime.simulation.on("tick", () => {
    runtime.nodesLayer
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(nodes, (d) => d.id)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)

    const latest = nodes.find((item) => item.isLatest)
    if (!latest) return

    runtime.trail.push({ x: latest.x, y: latest.y })
    if (runtime.trail.length > TRAIL_LIMIT) {
      runtime.trail = runtime.trail.slice(runtime.trail.length - TRAIL_LIMIT)
    }

    const trailLine = d3
      .line<{ x: number; y: number }>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveBasis)

    runtime.locusPath
      .attr("stroke", color)
      .attr("opacity", 0.85)
      .attr("d", trailLine(runtime.trail))

    const trailDots = runtime.locusDotsLayer
      .selectAll<SVGCircleElement, { x: number; y: number }>("circle")
      .data(runtime.trail)

    trailDots.exit().remove()

    trailDots
      .enter()
      .append("circle")
      .attr("r", 2)
      .merge(trailDots as any)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("fill", color)
      .attr("opacity", (_d, i) => Math.max(0.12, i / runtime.trail.length))
  })
}

export function D3EnvironmentalLocus() {
  const hostRefs = useRef<Record<MetricKey, HTMLDivElement | null>>({
    aqi: null,
    noise_db: null,
    water_ph: null,
  })
  const runtimeRefs = useRef<Partial<Record<MetricKey, ChartRuntime>>>({})
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)

  const pointsByMetric = useMemo(() => {
    return {
      aqi: pointsForMetric(rows, METRICS[0].valueOf),
      noise_db: pointsForMetric(rows, METRICS[1].valueOf),
      water_ph: pointsForMetric(rows, METRICS[2].valueOf),
    }
  }, [rows])

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
        // Keep last successful dataset if network call fails.
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchHistory()
    const intervalId = window.setInterval(fetchHistory, POLL_INTERVAL_MS)

    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    METRICS.forEach((metric) => {
      const host = hostRefs.current[metric.key]
      if (!host) return

      if (!runtimeRefs.current[metric.key]) {
        runtimeRefs.current[metric.key] = createRuntime(host)
      }

      const runtime = runtimeRefs.current[metric.key]
      if (!runtime) return

      updateRuntime(runtime, pointsByMetric[metric.key], metric.color)
    })
  }, [pointsByMetric])

  useEffect(() => {
    const handleResize = () => {
      METRICS.forEach((metric) => {
        const runtime = runtimeRefs.current[metric.key]
        if (!runtime) return
        updateRuntime(runtime, pointsByMetric[metric.key], metric.color)
      })
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)

      METRICS.forEach((metric) => {
        const runtime = runtimeRefs.current[metric.key]
        if (!runtime) return
        runtime.simulation.stop()
        runtime.svg.remove()
      })
    }
  }, [pointsByMetric])

  return (
    <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">Environmental Dynamics Simulation</h3>
        <p className="text-[11px] text-slate-400">
          {loading ? "Loading history..." : "D3 locus-trace update every 5s"}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {METRICS.map((metric) => (
          <div key={metric.key} className="rounded-2xl border border-white/5 bg-black/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">{metric.title}</p>
              <span className="text-[10px] text-slate-500">{metric.unit}</span>
            </div>
            <div
              ref={(node) => {
                hostRefs.current[metric.key] = node
              }}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
