/** Lightweight SVG line/bar charts — no charting library dependency. */

interface Point {
  bucket: string
  value: number
}

function formatDay(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function LineChart({ data, color = '#1c63e0', height = 200 }: { data: Point[]; color?: string; height?: number }) {
  if (!data.length) return <EmptyChart height={height} />
  const width = 640
  const padding = 28
  const max = Math.max(1, ...data.map((d) => d.value))
  const stepX = (width - padding * 2) / Math.max(1, data.length - 1)

  const points = data.map((d, i) => {
    const x = padding + i * stepX
    const y = height - padding - (d.value / max) * (height - padding * 2)
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${height - padding} L${points[0].x.toFixed(1)},${height - padding} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Line chart">
      <defs>
        <linearGradient id="miniChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#eef1f8" strokeWidth={1} />
      <path d={areaPath} fill="url(#miniChartFill)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i} className="group">
          <circle cx={p.x} cy={p.y} r={3} fill={color} />
          <title>
            {formatDay(p.bucket)}: {p.value}
          </title>
        </g>
      ))}
      {points.length > 1 && (
        <>
          <text x={points[0].x} y={height - 8} fontSize={10} fill="#8598ca" textAnchor="start">
            {formatDay(points[0].bucket)}
          </text>
          <text x={points[points.length - 1].x} y={height - 8} fontSize={10} fill="#8598ca" textAnchor="end">
            {formatDay(points[points.length - 1].bucket)}
          </text>
        </>
      )}
    </svg>
  )
}

export function BarChart({ data, color = '#3182f6' }: { data: { label: string; value: number }[]; color?: string }) {
  if (!data.length) return <EmptyChart height={180} />
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-navy-600">{d.label}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-navy-50">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-sm font-medium text-navy-800">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div className="flex items-center justify-center text-sm text-navy-300" style={{ height }}>
      No data for this range yet.
    </div>
  )
}
