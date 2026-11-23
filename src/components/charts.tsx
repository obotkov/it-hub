import { useEffect, useId, useRef, useState } from 'react'

type Series = { name: string; data: number[]; color: string }

export function LineChart({ series, labels, height = 220 }: { series: Series[]; labels?: string[]; height?: number }) {
  const id = useId()
  // draw at the real pixel width so text and strokes are never stretched
  const box = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const h = height
  const pad = { l: 40, r: 8, t: 10, b: 22 }
  const all = series.flatMap((s) => s.data)
  const top = Math.max(...all) * 1.08 || 1
  const step = niceStep(top / 4)
  const max = Math.ceil(top / step) * step
  const n = series[0]?.data.length ?? 0
  const x = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / Math.max(n - 1, 1)
  const y = (v: number) => pad.t + (h - pad.t - pad.b) * (1 - v / max)
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step)
  return (
    <div ref={box}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} className="block">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="1" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-white/5" />
            <text x={pad.l - 8} y={y(t) + 3.5} textAnchor="end" fontSize="11" className="fill-slate-500 font-mono">
              {fmt(t)}
            </text>
          </g>
        ))}
        {series.map((s, si) => {
          const d = s.data.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')
          return (
            <g key={si}>
              {si === 0 && <path d={`${d} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#${id}-${si})`} />}
              <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          )
        })}
        {labels &&
          labels.map((l, i) =>
            i % Math.ceil(labels.length / Math.max(2, Math.floor(w / 90))) === 0 ? (
              <text key={i} x={x(i)} y={h - 6} textAnchor={i === 0 ? 'start' : 'middle'} fontSize="11" className="fill-slate-500 font-mono">
                {l}
              </text>
            ) : null,
          )}
      </svg>
      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-4">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function BarChart({ data, color = '#8b5cf6', height = 200 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const max = Math.max(...data.map((d) => d.value)) || 1
  return (
    <div className="flex items-stretch gap-2" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="group flex flex-1 flex-col items-center gap-2">
          <div className="relative flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md transition-colors group-hover:opacity-80"
              style={{ height: `${(d.value / max) * 100}%`, background: `linear-gradient(180deg, ${color}, ${color}55)` }}
            />
            <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-300 opacity-0 transition group-hover:opacity-100">
              {fmt(d.value)}
            </span>
          </div>
          <span className="truncate text-[10px] text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export function Donut({ data, size = 150 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((a, b) => a + b.value, 0)
  const r = 42
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }} className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-white/5" strokeWidth="12" />
        {data.map((d) => {
          const len = (d.value / total) * c
          const el = <circle key={d.label} cx="50" cy="50" r={r} fill="none" stroke={d.color} strokeWidth="12" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} />
          acc += len
          return el
        })}
      </svg>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="text-slate-300">{d.label}</span>
            <span className="ml-auto pl-4 tabular-nums text-slate-500">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Sparkline({ data, color = '#a78bfa' }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const d = data.map((v, i) => `${i ? 'L' : 'M'}${(i / (data.length - 1)) * 100},${30 - ((v - min) / (max - min || 1)) * 28}`).join(' ')
  return (
    <svg viewBox="0 0 100 32" className="h-8 w-24" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)))
  return [1, 2, 2.5, 5, 10].map((k) => k * p).find((k) => k >= raw) ?? 10 * p
}

export function fmt(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.0', '') + 'K'
  return Math.round(n).toString()
}

export function series(n: number, base: number, amp: number, seed = 1) {
  let s = seed
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  return Array.from({ length: n }, (_, i) => Math.round(base + Math.sin(i / 2.2 + seed) * amp * 0.5 + rnd() * amp + i * (amp / n)))
}

export const days = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - (n - 1 - i) * 864e5)
    return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
  })
