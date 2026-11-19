import { KeyboardEvent, MouseEvent as RME, ReactNode, UIEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, Pencil, Star, User, BookOpen, Eye, Lock, Link2, MoreVertical, Save, Play, Search, Plus, Calendar, Hash, Type, GripVertical,
  Clock, List, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Code2, Zap, Terminal, Maximize2, Minimize2,
  Database, Table2, X, Check, AreaChart, LineChart as LineIcon, BarChart3, Trash2, AlignLeft, Copy,
} from 'lucide-react'
import { Badge, Modal, cx } from '../../components/ui'

/* ============================== data & query engine ============================== */

type Row = { time_dt: string; rids: number; rids_not_in_events: number; percent: number }
type Col = { key: keyof Row; type: 'date' | 'number' }
const COLUMNS: Col[] = [
  { key: 'time_dt', type: 'date' },
  { key: 'rids', type: 'number' },
  { key: 'rids_not_in_events', type: 'number' },
  { key: 'percent', type: 'number' },
]

type Param = { id: string; name: string; type: 'Число' | 'Строка' | 'Дата'; value: string }

const DEFAULT_SQL = `SELECT
    toDateTime(toStartOfInterval(toTimeZone(utc_event_time, 'Europe/Moscow'), interval {{Интервал, мин}} minute)) as time_dt,
    uniqExact(ecom.rid) as rids,
    uniqExactIf(
        ecom.rid,
        ecom.rid not in
        (
            SELECT distinct ecom.rid
            FROM events.events_flat
            WHERE 1=1
                AND utc_event_date between (toDate(now())) - interval 1 day and (toDate(now()))
                and toTimeZone(utc_event_time, 'Europe/Moscow') < now() - interval 60 minute
        )
    ) as rids_not_in_events,
    rids_not_in_events / rids as percent
FROM events.ecom_events AS ecom
WHERE utc_event_date >= toDate(now()) - 1
GROUP BY time_dt
ORDER BY time_dt`

const pad2 = (n: number) => String(n).padStart(2, '0')

function isoMsk(t: number) {
  const d = new Date(t + 3 * 3600e3)
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:00+03:00`
}

function makeRows(interval: number, seed = 11): Row[] {
  const n = Math.max(1, Math.floor((21 * 60) / interval))
  const start = Date.UTC(2026, 10, 18, 0, 0) // 03:00 MSK
  let s = seed
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  const k = 0.7 + ((seed * 37) % 60) / 100
  return Array.from({ length: n }, (_, i) => {
    const h = 3 + (i * interval) / 60
    let p = 0.0105 + (h > 9.5 ? ((h - 9.5) / 13.5) * 0.011 : 0)
    if (h >= 5.5 && h < 9.3) p += 0.008 + 0.004 * Math.sin((h - 5.5) * 2.2)
    if (h >= 22.7) p += 0.006
    p += (r() - 0.5) * 0.0022
    const rids = Math.round((38000 + r() * 6000 + Math.sin(h / 3 + seed) * 2500) * (interval / 15) * k)
    const lost = Math.round(rids * p)
    return { time_dt: isoMsk(start + i * interval * 60e3), rids, rids_not_in_events: lost, percent: +(lost / rids).toFixed(3) }
  })
}

type Result = { rows: Row[]; ms: number; at: Date }

function runQuery(sql: string, params: Param[], limit: boolean, seed = 11): Result | { error: string } {
  const missing = Array.from(sql.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)).map((m) => m[1]).filter((name) => !params.some((p) => p.name === name))
  if (missing.length) return { error: `Не задан параметр: ${missing.join(', ')}. Добавьте его в «Фильтры».` }
  if (!/^\s*select\b/i.test(sql)) return { error: 'Разрешены только запросы SELECT.' }
  const intervalParam = params.find((p) => p.name === 'Интервал, мин')
  const interval = intervalParam ? Number(intervalParam.value) : 15
  if (!Number.isFinite(interval) || interval < 1 || interval > 720) return { error: 'Параметр «Интервал, мин» должен быть числом от 1 до 720.' }
  let rows = makeRows(interval, seed)
  if (limit) rows = rows.slice(0, 1000)
  return { rows, ms: 4000 + Math.round(Math.random() * 2500), at: new Date() }
}

const fmtMs = (ms: number) => `${pad2(Math.floor(ms / 60000))}:${pad2(Math.floor(ms / 1000) % 60)}:${String(ms % 1000).padStart(3, '0')}`
const fmtAt = (d: Date) => `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
const fmtNum = (n: number, key: keyof Row) => (key === 'percent' ? n.toFixed(3).replace('.', ',') : n.toLocaleString('ru-RU'))
const fmtShort = (n: number, key: keyof Row) => (key === 'percent' ? n.toFixed(3).replace('.', ',') : n >= 1000 ? `${(n / 1000).toFixed(3).replace('.', ',')} тыс.` : String(n))

/* ============================== SQL highlighting ============================== */

const KEYWORDS = new Set(
  'select from where and or not in as distinct between interval day days minute minutes hour second group by order having limit join left right inner outer on union all case when then else end is null like desc asc with over partition'.split(' '),
)
const TOKEN = /(--[^\n]*)|(\{\{[^}]*\}\})|('(?:[^'\\]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()|([A-Za-z_][A-Za-z0-9_]*)|([()])/g

function highlight(src: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index))
    const [t, comment, param, str, num, fn, word, paren] = m
    const cls = comment
      ? 'text-slate-500 italic'
      : param
        ? 'text-fuchsia-400'
        : str
          ? 'text-emerald-500'
          : num
            ? 'text-orange-400'
            : fn
              ? 'text-sky-400'
              : word && KEYWORDS.has(word.toLowerCase())
                ? 'text-violet-400'
                : paren
                  ? 'text-amber-400'
                  : ''
    out.push(cls ? <span key={i++} className={cls}>{t}</span> : t)
    last = m.index + t.length
  }
  out.push(src.slice(last))
  return out
}

function formatSql(sql: string) {
  return sql.replace(/\b([A-Za-z_]+)\b/g, (w) => (KEYWORDS.has(w.toLowerCase()) && !/^(day|days|minute|minutes|hour|second)$/i.test(w) ? w.toUpperCase() : w))
}

function SqlEditor({ value, onChange, onRun, height }: { value: string; onChange: (v: string) => void; onRun: () => void; height: number }) {
  const ta = useRef<HTMLTextAreaElement>(null)
  const [scroll, setScroll] = useState({ top: 0, left: 0 })
  const [line, setLine] = useState(1)
  const lines = value.split('\n').length
  const onScroll = (e: UIEvent<HTMLTextAreaElement>) => setScroll({ top: e.currentTarget.scrollTop, left: e.currentTarget.scrollLeft })
  const caret = () => {
    const el = ta.current
    if (el) setLine(value.slice(0, el.selectionStart).split('\n').length)
  }
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onRun()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.currentTarget
      const { selectionStart: a, selectionEnd: b } = el
      onChange(value.slice(0, a) + '    ' + value.slice(b))
      requestAnimationFrame(() => el.setSelectionRange(a + 4, a + 4))
    }
  }
  const font = 'font-mono text-[13px] leading-6'
  return (
    <div className="relative flex overflow-hidden rounded-xl" style={{ height }}>
      <div className={cx('w-12 shrink-0 select-none overflow-hidden border-r border-white/[0.05] py-3 pr-3 text-right text-slate-500', font)}>
        <div style={{ transform: `translateY(${-scroll.top}px)` }}>
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className={i + 1 === line ? 'text-violet-400' : ''}>{i + 1}</div>
          ))}
        </div>
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 h-6 bg-white/[0.03]" style={{ top: 12 + (line - 1) * 24 - scroll.top }} />
          <pre className={cx('m-0 whitespace-pre p-3 text-slate-200', font)} style={{ transform: `translate(${-scroll.left}px, ${-scroll.top}px)` }}>
            {highlight(value)}
            {'\n'}
          </pre>
        </div>
        <textarea
          ref={ta}
          value={value}
          spellCheck={false}
          wrap="off"
          onChange={(e) => {
            onChange(e.target.value)
            caret()
          }}
          onScroll={onScroll}
          onKeyDown={onKey}
          onKeyUp={caret}
          onClick={caret}
          className={cx('absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent p-3 text-transparent caret-violet-400 outline-none selection:bg-violet-500/30', font)}
        />
      </div>
    </div>
  )
}

/* ============================== chart ============================== */

type ChartType = 'area' | 'line' | 'bar'
type ChartTab = { id: string; title: string; type: ChartType; metric: keyof Row }
const metricName: Record<string, string> = { rids: 'Уникальные rid', rids_not_in_events: 'Потерянные события', percent: 'Доля потерянных событий' }

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(800)
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

function TimeChart({ rows, metric, type, height = 520 }: { rows: Row[]; metric: keyof Row; type: ChartType; height?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const vals = rows.map((r) => r[metric] as number)
  const isPct = metric === 'percent'
  const minV = type === 'bar' ? 0 : Math.min(...vals)
  const maxV = Math.max(...vals)
  const span = maxV - minV || 1
  const lo = Math.max(0, minV - span * 0.05)
  const hi = maxV + span * 0.08
  const pad = { l: 76, r: 16, t: 16, b: 56 }
  const iw = Math.max(10, w - pad.l - pad.r)
  const ih = height - pad.t - pad.b
  const n = rows.length
  const x = (i: number) => pad.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1))
  const y = (v: number) => pad.t + ih * (1 - (v - lo) / (hi - lo))
  const ticks = Array.from({ length: 6 }, (_, i) => lo + ((hi - lo) * i) / 5)
  const yfmt = (v: number) => (isPct ? `${(v * 100).toFixed(1).replace('.', ',')} %` : v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace('.', ',')} тыс.` : v.toFixed(0))
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 84))))
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')
  const color = '#5b8db8'
  const bw = Math.max(2, (iw / n) * 0.7)

  const onMove = (e: RME<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const i = Math.round(((px - pad.l) / iw) * (n - 1))
    setHover(i >= 0 && i < n ? i : null)
  }

  return (
    <div ref={ref} className="relative w-full">
      <svg width={w} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} className="block">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={pad.l + iw} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-white/[0.07]" />
            <text x={pad.l - 10} y={y(t) + 4} textAnchor="end" fontSize="11" className="fill-slate-500">{yfmt(t)}</text>
          </g>
        ))}
        {rows.map((_, i) =>
          i % labelEvery === 0 ? <line key={'g' + i} x1={x(i)} x2={x(i)} y1={pad.t} y2={pad.t + ih} stroke="currentColor" className="text-white/[0.05]" /> : null,
        )}
        {type === 'bar'
          ? vals.map((v, i) => <rect key={i} x={x(i) - bw / 2} y={y(v)} width={bw} height={pad.t + ih - y(v)} fill={color} opacity={hover === i ? 1 : 0.75} rx={1} />)
          : (
            <>
              {type === 'area' && <path d={`${d} L${x(n - 1)},${pad.t + ih} L${x(0)},${pad.t + ih} Z`} fill={color} opacity={0.3} />}
              <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
            </>
          )}
        {rows.map((r, i) => {
          if (i % labelEvery !== 0) return null
          const [date, time] = r.time_dt.split('T')
          const [yy, mm, dd] = date.split('-')
          return (
            <text key={'l' + i} x={x(i)} y={pad.t + ih + 18} textAnchor="middle" fontSize="11" className="fill-slate-500">
              <tspan x={x(i)}>{`${dd}.${mm}.${yy}`}</tspan>
              <tspan x={x(i)} dy="14">{time.slice(0, 8)}</tspan>
            </text>
          )
        })}
        <text x={14} y={pad.t + ih / 2} fontSize="11" className="fill-slate-500" transform={`rotate(-90 14 ${pad.t + ih / 2})`} textAnchor="middle">{isPct ? '%' : metric}</text>
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke={color} strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(vals[hover])} r={4} fill={color} stroke="white" strokeWidth={1.5} />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-xs shadow-xl"
          style={{ left: Math.min(x(hover) + 12, w - 180), top: Math.max(8, y(vals[hover]) - 50) }}
        >
          <div className="text-slate-400">{rows[hover].time_dt.replace('T', ' ').slice(0, 16)}</div>
          <div className="mt-0.5 font-medium text-white">{metricName[metric] ?? metric}: {isPct ? `${(vals[hover] * 100).toFixed(2)} %` : vals[hover].toLocaleString('ru-RU')}</div>
        </div>
      )}
      <div className="mt-1 text-center text-xs text-slate-500">time_dt</div>
      <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-300">
        <span className="h-3 w-3 rounded-sm" style={{ background: color }} />
        {metricName[metric] ?? metric}
      </div>
    </div>
  )
}

/* ============================== shared bits ============================== */

function Chip({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cx('inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2 py-1 text-xs text-slate-300', onClick ? 'hover:bg-white/10' : 'cursor-default', className)}>
      {children}
    </button>
  )
}

function SourceSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const sources = ['Datalake', 'prod-postgres', 'events-ch', 'wildmetrics']
  return (
    <div className="relative min-w-0 flex-1">
      <button onClick={() => setOpen(!open)} className="flex h-10 w-full items-center gap-2 rounded-xl border border-white/10 bg-ink-850 px-3 text-sm text-slate-100">
        <span className="flex gap-[2px]">{[0, 1, 2, 3].map((i) => <span key={i} className="h-4 w-[3px] rounded-sm bg-amber-400" style={{ opacity: 1 - i * 0.2 }} />)}</span>
        <span className="flex-1 truncate text-left">{value}</span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-40 mt-1 animate-fadeup rounded-xl border border-white/10 bg-ink-850 p-1 shadow-2xl">
            {sources.map((s) => (
              <button key={s} onClick={() => { onChange(s); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5">
                <Database className="h-4 w-4 text-slate-500" /> {s} {s === value && <Check className="ml-auto h-4 w-4 text-violet-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function FiltersPanel({ params, setParams }: { params: Param[]; setParams: (p: Param[]) => void }) {
  const [open, setOpen] = useState(true)
  const [typeMenu, setTypeMenu] = useState<string | null>(null)
  const update = (id: string, patch: Partial<Param>) => setParams(params.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  return (
    <div>
      <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-3">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-sm font-medium text-white">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />} Фильтры
        </button>
        <span className="on-accent grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1.5 text-[11px] font-medium text-white">{params.length}</span>
        <button onClick={() => setParams([...params, { id: 'p' + Date.now(), name: `Параметр ${params.length + 1}`, type: 'Строка', value: '' }])} title="Добавить параметр" className="ml-auto grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-slate-300 hover:bg-white/5"><Plus className="h-4 w-4" /></button>
      </div>
      {open && (
        <div className="space-y-4 p-4">
          {params.length === 0 && <p className="text-xs text-slate-500">Параметры подставляются в запрос как <code className="text-fuchsia-400">{'{{Название}}'}</code>.</p>}
          {params.map((p) => (
            <div key={p.id}>
              <div className="mb-1.5 flex items-center gap-1.5 text-sm">
                <GripVertical className="h-3.5 w-3.5 text-slate-600" />
                <input value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} className="min-w-0 flex-1 bg-transparent text-slate-400 outline-none focus:text-white" />
                <div className="relative">
                  <button onClick={() => setTypeMenu(typeMenu === p.id ? null : p.id)} className="flex items-center gap-1 text-slate-200">{p.type} <ChevronDown className="h-3.5 w-3.5 text-violet-400" /></button>
                  {typeMenu === p.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setTypeMenu(null)} />
                      <div className="absolute right-0 z-40 mt-1 w-32 rounded-lg border border-white/10 bg-ink-850 p-1 shadow-xl">
                        {(['Число', 'Строка', 'Дата'] as const).map((t) => (
                          <button key={t} onClick={() => { update(p.id, { type: t }); setTypeMenu(null) }} className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-slate-200 hover:bg-white/5">{t}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button onClick={() => setParams(params.filter((x) => x.id !== p.id))} title="Удалить параметр" className="rounded p-0.5 text-slate-500 hover:text-rose-400"><X className="h-3.5 w-3.5" /></button>
              </div>
              <input
                className="input"
                type={p.type === 'Число' ? 'number' : p.type === 'Дата' ? 'date' : 'text'}
                value={p.value}
                onChange={(e) => update(p.id, { value: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================== page ============================== */

function QueryEditor({ q, onBack, onSave }: { q: Query; onBack: (q: Query) => void; onSave: (q: Query) => void }) {
  const [title, setTitle] = useState(q.title)
  const [editTitle, setEditTitle] = useState(false)
  const [desc, setDesc] = useState(q.desc)
  const [editDesc, setEditDesc] = useState(false)
  const [star, setStar] = useState(q.star)
  const [source, setSource] = useState(q.source)
  const [sql, setSql] = useState(q.sql)
  const [params, setParams] = useState<Param[]>(q.params)
  const [result, setResult] = useState<Result>(() => ({ rows: makeRows(intervalOf(q.params), q.seed), ms: 5318, at: new Date() }))
  const [auto, setAuto] = useState(false)
  const [tabs, setTabs] = useState<ChartTab[]>(q.tabs)
  const [tab, setTab] = useState(q.tabs[0]?.id ?? '')
  const [tabMenu, setTabMenu] = useState<string | null>(null)
  const [view, setView] = useState<'chart' | 'sql'>('chart')
  const [fieldQ, setFieldQ] = useState('')
  const [extraFields, setExtraFields] = useState<string[]>([])
  const [access, setAccess] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [more, setMore] = useState(false)

  const rerun = () => {
    const r = runQuery(sql, params, true, q.seed)
    if ('rows' in r) setResult(r)
  }
  useEffect(() => {
    if (!auto) return
    const t = setInterval(rerun, 60000)
    return () => clearInterval(t)
  }, [auto, sql, params]) // eslint-disable-line react-hooks/exhaustive-deps

  const changed = () => JSON.stringify([title, desc, star, source, sql, params, tabs]) !== JSON.stringify([q.title, q.desc, q.star, q.source, q.sql, q.params, q.tabs])
  const snapshot = (): Query => (changed() ? { ...q, title: title || 'Без названия', desc, star, source, sql, params, tabs, updated: new Date().toISOString() } : q)

  const flash = (m: string) => {
    setSaved(m)
    setTimeout(() => setSaved(null), 1800)
  }

  if (view === 'sql')
    return (
      <SqlView
        initialSql={sql}
        seed={q.seed}
        source={source}
        setSource={setSource}
        params={params}
        setParams={setParams}
        onCancel={() => setView('chart')}
        onApply={(s, r) => {
          setSql(s)
          setResult(r)
          setView('chart')
        }}
      />
    )

  const active = tabs.find((t) => t.id === tab) ?? tabs[0]
  const fields = [...COLUMNS.map((c) => ({ name: c.key as string, type: c.type })), ...extraFields.map((f) => ({ name: f, type: 'number' as const }))].filter((f) => f.name.includes(fieldQ))

  return (
    <div className="-m-4 flex min-h-[calc(100vh-4rem)] flex-col gap-3 bg-ink-950 p-3 sm:-m-6 lg:-m-8">
      {/* header */}
      <div className="card flex items-center gap-3 px-4 py-3">
        <button onClick={() => onBack(snapshot())} title="К списку запросов" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
        {editTitle ? (
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => setEditTitle(false)} onKeyDown={(e) => e.key === 'Enter' && setEditTitle(false)} className="input max-w-md py-1 text-lg font-medium" />
        ) : (
          <h1 className="min-w-0 truncate text-xl font-medium tracking-tight text-white">{title || 'Без названия'}</h1>
        )}
        <button onClick={() => setEditTitle(true)} title="Переименовать" className="rounded-lg p-1 text-slate-500 hover:text-white"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => setStar(!star)} title="В избранное" className="rounded-lg p-1 text-slate-500 hover:text-amber-400"><Star className={cx('h-4 w-4', star && 'fill-amber-400 text-amber-400')} /></button>
        <span title="Владелец: вы" className="p-1 text-slate-500"><User className="h-4 w-4" /></span>
        {editDesc ? (
          <input autoFocus value={desc} placeholder="Описание" onChange={(e) => setDesc(e.target.value)} onBlur={() => setEditDesc(false)} onKeyDown={(e) => e.key === 'Enter' && setEditDesc(false)} className="input w-64 py-1 text-sm" />
        ) : (
          <Chip onClick={() => setEditDesc(true)} className={cx('shrink-0 whitespace-nowrap', desc ? '' : 'bg-amber-500/10 text-amber-500')}><BookOpen className="h-3.5 w-3.5" /> {desc ? (desc.length > 24 ? desc.slice(0, 24) + '…' : desc) : 'Нет описания'}</Chip>
        )}
        <Chip className="hidden shrink-0 whitespace-nowrap xl:inline-flex"><Eye className="h-3.5 w-3.5" /> {q.views} за всё время</Chip>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {saved && <span className="text-xs text-emerald-400">{saved}</span>}
          <button onClick={() => setAccess(true)} className="btn-ghost"><Lock className="h-4 w-4" /> Доступы</button>
          <button onClick={() => { navigator.clipboard?.writeText(location.href).catch(() => {}); flash('Ссылка скопирована') }} title="Скопировать ссылку" className="btn-ghost px-2.5"><Link2 className="h-4 w-4" /></button>
          <div className="relative">
            <button onClick={() => setMore(!more)} className="btn-ghost px-2.5"><MoreVertical className="h-4 w-4" /></button>
            {more && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMore(false)} />
                <div className="absolute right-0 z-40 mt-1 w-52 rounded-xl border border-white/10 bg-ink-850 p-1 shadow-2xl">
                  <button onClick={() => { setMore(false); flash('Копия создана') }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"><Copy className="h-4 w-4" /> Дублировать</button>
                  <button onClick={() => { setMore(false); setView('sql') }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"><Code2 className="h-4 w-4" /> Открыть SQL</button>
                </div>
              </>
            )}
          </div>
          <button onClick={() => { onSave(snapshot()); flash('Сохранено') }} className="btn-primary"><Save className="h-4 w-4" /> Сохранить</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        {/* left panel */}
        <div className="card flex w-full shrink-0 flex-col lg:w-[400px]">
          <div className="border-b border-white/[0.05] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
              Источник данных и поля
              <span className="on-accent grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1.5 text-[11px] text-white">{fields.length}</span>
            </div>
            <div className="flex gap-2">
              <div className="flex min-w-0 flex-1">
                <SourceSelect value={source} onChange={setSource} />
                <button onClick={rerun} title="Выполнить запрос" className="ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-ink-850 text-slate-200 hover:bg-white/5"><Play className="h-4 w-4 fill-current" /></button>
              </div>
              <button onClick={() => setView('sql')} className="btn-primary h-10 whitespace-nowrap"><Code2 className="h-4 w-4" /> SQL-редактор</button>
            </div>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input className="input pl-9" placeholder="Поиск" value={fieldQ} onChange={(e) => setFieldQ(e.target.value)} />
              </div>
              <button onClick={() => setExtraFields((x) => [...x, `calc_${x.length + 1}`])} title="Вычисляемое поле" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/5"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 max-h-44 space-y-1.5 overflow-y-auto pr-1">
              {fields.map((f) => (
                <div key={f.name} draggable className="group flex cursor-grab items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.07]">
                  {f.type === 'date' ? <Calendar className="h-4 w-4 text-slate-500" /> : <Hash className="h-4 w-4 text-slate-500" />}
                  <span className="flex-1 truncate font-mono text-[13px]">{f.name}</span>
                  <GripVertical className="h-4 w-4 text-slate-600 opacity-60 group-hover:opacity-100" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip onClick={() => setAuto(!auto)}><Clock className="h-3.5 w-3.5" /> Автообновление: {auto ? '1 мин' : 'выкл'}</Chip>
              <Chip className="text-emerald-500"><Play className="h-3 w-3 fill-current" /> {fmtMs(result.ms)}</Chip>
              <Chip><List className="h-3.5 w-3.5" /> {result.rows.length}</Chip>
            </div>
          </div>
          <FiltersPanel params={params} setParams={setParams} />
        </div>

        {/* charts */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-end gap-1">
            {tabs.map((t) => (
              <div key={t.id} className={cx('relative flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm', tab === t.id ? 'bg-ink-900 text-white' : 'bg-white/[0.03] text-slate-400 hover:text-slate-200')}>
                <button onClick={() => setTab(t.id)}>{t.title}</button>
                <button onClick={() => setTabMenu(tabMenu === t.id ? null : t.id)} className="rounded p-0.5 text-slate-500 hover:text-white"><MoreVertical className="h-3.5 w-3.5" /></button>
                {tabMenu === t.id && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setTabMenu(null)} />
                    <div className="absolute left-0 top-full z-40 mt-1 w-60 rounded-xl border border-white/10 bg-ink-850 p-1 shadow-2xl">
                      <div className="px-3 pb-1 pt-2 text-[11px] text-slate-500">Тип</div>
                      {([['area', 'Площадь', AreaChart], ['line', 'Линия', LineIcon], ['bar', 'Столбцы', BarChart3]] as const).map(([v, l, I]) => (
                        <button key={v} onClick={() => setTabs(tabs.map((x) => (x.id === t.id ? { ...x, type: v } : x)))} className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5">
                          <I className="h-4 w-4" /> {l} {t.type === v && <Check className="ml-auto h-4 w-4 text-violet-400" />}
                        </button>
                      ))}
                      <div className="px-3 pb-1 pt-2 text-[11px] text-slate-500">Показатель</div>
                      {(['percent', 'rids_not_in_events', 'rids'] as const).map((m) => (
                        <button key={m} onClick={() => setTabs(tabs.map((x) => (x.id === t.id ? { ...x, metric: m } : x)))} className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-slate-200 hover:bg-white/5">
                          <span className="truncate">{metricName[m]}</span> {t.metric === m && <Check className="ml-auto h-4 w-4 shrink-0 text-violet-400" />}
                        </button>
                      ))}
                      {tabs.length > 1 && (
                        <>
                          <div className="my-1 h-px bg-white/5" />
                          <button
                            onClick={() => {
                              const rest = tabs.filter((x) => x.id !== t.id)
                              setTabs(rest)
                              if (tab === t.id) setTab(rest[0].id)
                              setTabMenu(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-rose-300 hover:bg-white/5"
                          >
                            <Trash2 className="h-4 w-4" /> Удалить
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
            <button
              onClick={() => {
                const id = 't' + Date.now()
                setTabs([...tabs, { id, title: 'Диаграмма', type: 'line', metric: 'rids' }])
                setTab(id)
              }}
              title="Новая диаграмма"
              className="mb-0.5 grid h-9 w-9 place-items-center rounded-t-xl bg-white/[0.03] text-slate-400 hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="card flex-1 rounded-tl-none p-4">
            <TimeChart rows={result.rows} metric={active.metric} type={active.type} />
          </div>
        </div>
      </div>

      <Modal open={access} onClose={() => setAccess(false)} title="Доступы">
        <div className="space-y-3">
          {[['Вы', 'Владелец'], ['Команда аналитики', 'Редактор'], ['Все в кабинете', 'Просмотр']].map(([who, role]) => (
            <div key={who} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-ink-850 px-3 py-2.5 text-sm">
              <span className="text-slate-200">{who}</span>
              <Badge tone={role === 'Владелец' ? 'violet' : 'slate'}>{role}</Badge>
            </div>
          ))}
          <div className="flex gap-2"><input className="input" placeholder="Email или команда" /><button className="btn-primary">Пригласить</button></div>
        </div>
      </Modal>
    </div>
  )
}

/* ============================== SQL view ============================== */

const schema = [
  { name: 'events', tables: [{ name: 'ecom_events', cols: ['utc_event_time', 'utc_event_date', 'rid', 'event_name', 'user_id'] }, { name: 'events_flat', cols: ['utc_event_time', 'utc_event_date', 'rid', 'payload'] }] },
  { name: 'dwh', tables: [{ name: 'fact_orders', cols: ['order_id', 'user_id', 'amount', 'created_at'] }, { name: 'dim_users', cols: ['user_id', 'email', 'city'] }] },
  { name: 'mart', tables: [{ name: 'revenue_daily', cols: ['day', 'revenue', 'orders'] }] },
]

function SqlView({ initialSql, seed, source, setSource, params, setParams, onCancel, onApply }: {
  initialSql: string
  seed: number
  source: string
  setSource: (s: string) => void
  params: Param[]
  setParams: (p: Param[]) => void
  onCancel: () => void
  onApply: (sql: string, r: Result) => void
}) {
  const [sql, setSql] = useState(initialSql)
  const [limit, setLimit] = useState(true)
  const [res, setRes] = useState<Result | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [auto, setAuto] = useState(false)
  const [left, setLeft] = useState(true)
  const [full, setFull] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [q, setQ] = useState('')
  const [openSchema, setOpenSchema] = useState<Record<string, boolean>>({ events: true, 'events.ecom_events': true })
  const [history, setHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const run = () => {
    setBusy(true)
    setErr(null)
    setTimeout(() => {
      const r = runQuery(sql, params, limit, seed)
      if ('error' in r) {
        setErr(r.error)
        setRes(null)
      } else {
        setRes(r)
        setHistory((h) => [sql, ...h.filter((x) => x !== sql)].slice(0, 5))
      }
      setBusy(false)
    }, 700)
  }
  useEffect(run, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    document.querySelector('main')?.scrollTo(0, 0)
  }, [])

  const insert = (text: string) => setSql((s) => s + (s.endsWith('\n') ? '' : '\n') + text)

  return (
    <div className="-m-4 flex min-h-[calc(100vh-4rem)] flex-col bg-ink-950 sm:-m-6 lg:-m-8">
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-ink-900 px-5 py-3">
        <Code2 className="h-5 w-5 text-violet-400" />
        <h1 className="text-lg font-medium text-white">SQL-редактор</h1>
        <div className="ml-auto flex gap-2">
          <button onClick={onCancel} className="btn-ghost">Отмена</button>
          <button disabled={!res || busy} onClick={() => res && onApply(sql, res)} className="btn-primary">Применить</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-3 p-3">
        {left && !full && (
          <div className="card flex w-[360px] shrink-0 flex-col">
            <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-3">
              <span className="text-sm font-medium text-white">Источник данных</span>
              <button onClick={() => setLeft(false)} title="Свернуть" className="ml-auto rounded-lg p-1 text-slate-500 hover:text-white"><ChevronsLeft className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 border-b border-white/[0.05] p-4">
              <SourceSelect value={source} onChange={setSource} />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input className="input pl-9" placeholder="Поиск" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="max-h-56 overflow-y-auto pt-1 font-mono text-[13px]">
                {schema.map((sc) => {
                  const tables = sc.tables.filter((t) => !q || t.name.includes(q) || t.cols.some((c) => c.includes(q)))
                  if (!tables.length) return null
                  return (
                    <div key={sc.name}>
                      <button onClick={() => setOpenSchema((o) => ({ ...o, [sc.name]: !o[sc.name] }))} className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-slate-300 hover:bg-white/5">
                        {openSchema[sc.name] || q ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        <Database className="h-3.5 w-3.5 text-amber-400" /> {sc.name}
                      </button>
                      {(openSchema[sc.name] || q) &&
                        tables.map((t) => {
                          const key = `${sc.name}.${t.name}`
                          return (
                            <div key={key} className="ml-4">
                              <div className="flex items-center gap-1.5 rounded px-1 py-1 text-slate-300 hover:bg-white/5">
                                <button onClick={() => setOpenSchema((o) => ({ ...o, [key]: !o[key] }))}>{openSchema[key] || q ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</button>
                                <Table2 className="h-3.5 w-3.5 text-cyan-400" />
                                <button onClick={() => insert(key)} title="Вставить в запрос" className="truncate hover:text-white">{t.name}</button>
                              </div>
                              {(openSchema[key] || q) &&
                                t.cols.map((c) => (
                                  <button key={c} onClick={() => insert(c)} title="Вставить в запрос" className="ml-6 flex w-[calc(100%-1.5rem)] items-center gap-1.5 rounded px-1 py-0.5 text-left text-slate-500 hover:bg-white/5 hover:text-slate-200">
                                    {/time|date|_at|day/.test(c) ? <Calendar className="h-3 w-3" /> : /id|amount|revenue|orders/.test(c) ? <Hash className="h-3 w-3" /> : <Type className="h-3 w-3" />} {c}
                                  </button>
                                ))}
                            </div>
                          )
                        })}
                    </div>
                  )
                })}
              </div>
            </div>
            <FiltersPanel params={params} setParams={setParams} />
          </div>
        )}
        {(!left || full) && !full && (
          <button onClick={() => setLeft(true)} title="Развернуть" className="card grid w-10 shrink-0 place-items-start justify-center pt-4 text-slate-400 hover:text-white"><ChevronsRight className="h-4 w-4" /></button>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="card">
            <div className="flex items-center gap-1 border-b border-white/[0.05] px-4 py-2.5">
              <span className="text-sm font-medium text-white">Редактор</span>
              <div className="ml-auto flex items-center gap-1 text-slate-500">
                <button onClick={() => setSql(formatSql(sql))} title="Форматировать" className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white"><AlignLeft className="h-4 w-4" /></button>
                <button onClick={run} title="Выполнить (⌘+Enter)" className="rounded-lg p-1.5 text-violet-400 hover:bg-white/10"><Zap className="h-4 w-4" /></button>
                <div className="relative">
                  <button onClick={() => setShowHistory(!showHistory)} title="История запросов" className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white"><Terminal className="h-4 w-4" /></button>
                  {showHistory && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowHistory(false)} />
                      <div className="absolute right-0 z-40 mt-1 w-80 rounded-xl border border-white/10 bg-ink-850 p-1 shadow-2xl">
                        <div className="px-3 py-1.5 text-[11px] text-slate-500">История</div>
                        {history.length === 0 && <div className="px-3 py-2 text-xs text-slate-500">Пока пусто</div>}
                        {history.map((h, i) => (
                          <button key={i} onClick={() => { setSql(h); setShowHistory(false) }} className="block w-full truncate rounded-lg px-3 py-2 text-left font-mono text-xs text-slate-300 hover:bg-white/5">{h.replace(/\s+/g, ' ').slice(0, 80)}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button onClick={() => setFull(!full)} title={full ? 'Свернуть' : 'На весь экран'} className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white">{full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
              </div>
            </div>
            <div className="px-2 pt-2">
              <SqlEditor value={sql} onChange={setSql} onRun={run} height={full ? 520 : 312} />
            </div>
            <div className="flex flex-wrap items-center gap-2 px-4 py-3">
              <button onClick={run} disabled={busy} className="btn-primary">{busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Play className="h-4 w-4 fill-current" />} Выполнить</button>
              <label className="ml-2 flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                <input type="checkbox" checked={limit} onChange={(e) => setLimit(e.target.checked)} className="h-4 w-4 accent-violet-600" /> Лимит 1000
              </label>
              {res && (
                <>
                  <Chip className="text-emerald-500"><Play className="h-3 w-3 fill-current" /> {fmtMs(res.ms)}</Chip>
                  <Chip><List className="h-3.5 w-3.5" /> Строк: {res.rows.length}</Chip>
                  <Chip><Clock className="h-3.5 w-3.5" /> {fmtAt(res.at)}</Chip>
                </>
              )}
              <Chip onClick={() => setAuto(!auto)}><Clock className="h-3.5 w-3.5" /> Автообновление: {auto ? '1 мин' : 'выкл'}</Chip>
            </div>
          </div>

          {!full && (
            <div className="card flex min-h-0 flex-1 flex-col">
              <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-3">
                <button onClick={() => setPreviewOpen(!previewOpen)} className="flex items-center gap-2 text-sm font-medium text-white">
                  {previewOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />} Предпросмотр
                </button>
              </div>
              {previewOpen && (
                <div className="p-3">
                  {err ? (
                    <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] p-4 text-sm text-rose-300"><X className="mt-0.5 h-4 w-4 shrink-0" /> {err}</div>
                  ) : busy && !res ? (
                    <div className="py-16 text-center text-sm text-slate-500">Выполняется запрос…</div>
                  ) : res ? (
                    <Preview rows={res.rows} />
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================== preview table ============================== */

function Preview({ rows }: { rows: Row[] }) {
  const [f, setF] = useState<Record<string, [string, string]>>({})
  const [page, setPage] = useState(1)
  const per = 10
  const stats = useMemo(() => {
    const s: Record<string, [number, number]> = {}
    COLUMNS.filter((c) => c.type === 'number').forEach((c) => {
      const v = rows.map((r) => r[c.key] as number)
      s[c.key] = [Math.min(...v), Math.max(...v)]
    })
    return s
  }, [rows])
  const filtered = rows.filter((r) =>
    COLUMNS.every((c) => {
      const [a, b] = f[c.key] ?? ['', '']
      if (c.type === 'date') {
        const t = r.time_dt.slice(11, 16)
        return (!a || t >= a) && (!b || t <= b)
      }
      const v = r[c.key] as number
      const na = parseFloat(a.replace(',', '.'))
      const nb = parseFloat(b.replace(',', '.'))
      return (Number.isNaN(na) || v >= na) && (Number.isNaN(nb) || v <= nb)
    }),
  )
  const pages = Math.max(1, Math.ceil(filtered.length / per))
  const cur = Math.min(page, pages)
  const shown = filtered.slice((cur - 1) * per, cur * per)
  const set = (k: string, i: 0 | 1, v: string) => {
    setF((x) => {
      const pair: [string, string] = [...(x[k] ?? ['', ''])] as [string, string]
      pair[i] = v
      return { ...x, [k]: pair }
    })
    setPage(1)
  }
  const nums = (() => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
    const s = new Set([1, 2, cur - 1, cur, cur + 1, pages - 1, pages].filter((n) => n >= 1 && n <= pages))
    const arr = [...s].sort((a, b) => a - b)
    const out: (number | '…')[] = []
    arr.forEach((n, i) => {
      if (i && n - arr[i - 1] > 1) out.push('…')
      out.push(n)
    })
    return out
  })()
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full min-w-[640px] table-fixed text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {COLUMNS.map((c) => (
                <th key={c.key} className={cx('border-r border-white/[0.05] px-3 pb-2 pt-3 text-left font-medium text-white last:border-r-0', c.type === 'date' && 'w-[34%]')}>
                  <div className="mb-2">{c.key}</div>
                  <div className="flex items-center gap-1.5 font-normal">
                    {c.type === 'date' ? (
                      <div className="flex w-full items-center gap-1 rounded-lg border border-white/10 bg-ink-850 px-2">
                        <input value={f[c.key]?.[0] ?? ''} onChange={(e) => set(c.key, 0, e.target.value)} placeholder="Начало" title="Время начала, ЧЧ:ММ" className="h-8 min-w-0 flex-1 bg-transparent text-xs text-slate-300 outline-none placeholder:text-slate-500" />
                        <span className="text-slate-500">→</span>
                        <input value={f[c.key]?.[1] ?? ''} onChange={(e) => set(c.key, 1, e.target.value)} placeholder="Конец" title="Время окончания, ЧЧ:ММ" className="h-8 min-w-0 flex-1 bg-transparent text-xs text-slate-300 outline-none placeholder:text-slate-500" />
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      </div>
                    ) : (
                      <>
                        <input value={f[c.key]?.[0] ?? ''} onChange={(e) => set(c.key, 0, e.target.value)} placeholder={fmtShort(stats[c.key][0], c.key)} className="h-8 w-full min-w-0 rounded-lg border border-white/10 bg-ink-850 px-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-violet-500/50" />
                        <span className="text-slate-500">–</span>
                        <input value={f[c.key]?.[1] ?? ''} onChange={(e) => set(c.key, 1, e.target.value)} placeholder={fmtShort(stats[c.key][1], c.key)} className="h-8 w-full min-w-0 rounded-lg border border-white/10 bg-ink-850 px-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-violet-500/50" />
                      </>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.time_dt} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                {COLUMNS.map((c) => (
                  <td key={c.key} className={cx('whitespace-nowrap border-r border-white/[0.04] px-3 py-2.5 tabular-nums text-slate-200 last:border-r-0', c.type === 'number' && 'text-right')}>
                    {c.type === 'date' ? `"${r.time_dt}"` : fmtNum(r[c.key] as number, c.key)}
                  </td>
                ))}
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={COLUMNS.length} className="py-10 text-center text-sm text-slate-500">Нет строк, подходящих под фильтры</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-sm">
        <button disabled={cur === 1} onClick={() => setPage(cur - 1)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/5 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
        {nums.map((n, i) =>
          n === '…' ? (
            <span key={'e' + i} className="px-1 text-slate-500">…</span>
          ) : (
            <button key={n} onClick={() => setPage(n)} className={cx('h-8 min-w-8 rounded-lg px-2', n === cur ? 'border border-violet-500 text-violet-300' : 'text-slate-300 hover:bg-white/5')}>{n}</button>
          ),
        )}
        <button disabled={cur === pages} onClick={() => setPage(cur + 1)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/5 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  )
}

/* ============================== queries list ============================== */

type Query = {
  id: string
  title: string
  desc: string
  source: string
  sql: string
  params: Param[]
  tabs: ChartTab[]
  author: string
  updated: string
  views: number
  star: boolean
  seed: number
}

function intervalOf(params: Param[]) {
  const v = Number(params.find((p) => p.name === 'Интервал, мин')?.value)
  return Number.isFinite(v) && v >= 1 && v <= 720 ? v : 15
}

const ago = (h: number) => new Date(Date.now() - h * 3600e3).toISOString()

const simpleSql = (metric: string, table: string) => `SELECT
    toStartOfInterval(event_time, interval {{Интервал, мин}} minute) as time_dt,
    uniqExact(user_id) as rids,
    countIf(${metric}) as rids_not_in_events,
    rids_not_in_events / rids as percent
FROM ${table}
WHERE event_date >= today() - 1
GROUP BY time_dt
ORDER BY time_dt`

const interval = (v: string): Param[] => [{ id: 'p1', name: 'Интервал, мин', type: 'Число', value: v }]

const DEMO_QUERIES: Query[] = [
  {
    id: 'q1', title: 'Потерянные события, мониторинг 15 мин', desc: '', source: 'Datalake', sql: DEFAULT_SQL, params: interval('15'),
    tabs: [{ id: 't1', title: 'Диаграмма', type: 'area', metric: 'percent' }, { id: 't2', title: 'Диаграмма', type: 'bar', metric: 'rids_not_in_events' }],
    author: 'Вы', updated: ago(2), views: 6, star: true, seed: 11,
  },
  {
    id: 'q2', title: 'Ошибки оплаты по часам', desc: 'Доля неуспешных платежей от всех попыток', source: 'events-ch', sql: simpleSql("event_name = 'payment_failed'", 'events.payments'), params: interval('60'),
    tabs: [{ id: 't1', title: 'Доля ошибок', type: 'line', metric: 'percent' }],
    author: 'Анна Смирнова', updated: ago(20), views: 41, star: false, seed: 23,
  },
  {
    id: 'q3', title: 'Брошенные корзины', desc: 'Корзины без заказа в течение 30 минут', source: 'Datalake', sql: simpleSql("event_name = 'cart_abandoned'", 'events.ecom_events'), params: interval('30'),
    tabs: [{ id: 't1', title: 'Корзины', type: 'bar', metric: 'rids_not_in_events' }, { id: 't2', title: 'Доля', type: 'area', metric: 'percent' }],
    author: 'Илья Петров', updated: ago(30), views: 128, star: true, seed: 37,
  },
  {
    id: 'q4', title: 'Отказы на мобильном вебе', desc: 'Сессии с одним просмотром', source: 'wildmetrics', sql: simpleSql('pageviews = 1', 'wm.sessions'), params: interval('15'),
    tabs: [{ id: 't1', title: 'Отказы', type: 'area', metric: 'percent' }],
    author: 'Вы', updated: ago(52), views: 17, star: false, seed: 5,
  },
  {
    id: 'q5', title: 'Таймауты API поиска', desc: 'Запросы дольше 2 секунд', source: 'prod-postgres', sql: simpleSql('duration_ms > 2000', 'logs.search_requests'), params: interval('15'),
    tabs: [{ id: 't1', title: 'Таймауты', type: 'line', metric: 'rids_not_in_events' }],
    author: 'Мария Кузнецова', updated: ago(120), views: 9, star: false, seed: 61,
  },
]

const loadQueries = (): Query[] => {
  try {
    return JSON.parse(localStorage.getItem('hub.queries') || 'null') ?? DEMO_QUERIES
  } catch {
    return DEMO_QUERIES
  }
}

const fmtUpdated = (iso: string) => {
  const h = (Date.now() - new Date(iso).getTime()) / 3600e3
  if (h < 1 / 60) return 'только что'
  if (h < 1) return `${Math.round(h * 60)} мин назад`
  if (h < 24) return `${Math.round(h)} ч назад`
  const d = new Date(iso)
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`
}

const chartIcon = { area: AreaChart, line: LineIcon, bar: BarChart3 }

function Spark({ q }: { q: Query }) {
  const metric = q.tabs[0]?.metric ?? 'percent'
  const vals = makeRows(intervalOf(q.params), q.seed).map((r) => r[metric] as number)
  const step = Math.max(1, Math.floor(vals.length / 40))
  const v = vals.filter((_, i) => i % step === 0)
  const min = Math.min(...v)
  const max = Math.max(...v)
  const d = v.map((x, i) => `${i ? 'L' : 'M'}${(i / (v.length - 1)) * 100},${28 - ((x - min) / (max - min || 1)) * 24}`).join(' ')
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-28">
      <path d={`${d} L100,30 L0,30 Z`} fill="#5b8db8" opacity={0.18} />
      <path d={d} fill="none" stroke="#5b8db8" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function BiQueries() {
  const [queries, setQueries] = useState<Query[]>(loadQueries)
  const [open, setOpen] = useState<Query | null>(null)
  const [tab, setTab] = useState<'all' | 'mine' | 'star'>('all')
  const [q, setQ] = useState('')
  const [src, setSrc] = useState('')
  const [menu, setMenu] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem('hub.queries', JSON.stringify(queries))
    } catch {
      /* ignore */
    }
  }, [queries])

  const upsert = (x: Query) => setQueries((xs) => (xs.some((y) => y.id === x.id) ? xs.map((y) => (y.id === x.id ? x : y)) : [x, ...xs]))

  if (open)
    return (
      <QueryEditor
        key={open.id}
        q={open}
        onSave={upsert}
        onBack={(x) => {
          upsert(x)
          setOpen(null)
        }}
      />
    )

  const create = () =>
    setOpen({
      id: 'q' + Date.now(), title: 'Новый запрос', desc: '', source: 'Datalake', sql: simpleSql('1', 'events.ecom_events'), params: interval('15'),
      tabs: [{ id: 't1', title: 'Диаграмма', type: 'line', metric: 'rids' }], author: 'Вы', updated: new Date().toISOString(), views: 0, star: false,
      seed: Math.floor(Math.random() * 90) + 3,
    })

  const sources = Array.from(new Set(queries.map((x) => x.source)))
  const list = queries
    .filter((x) => (tab === 'mine' ? x.author === 'Вы' : tab === 'star' ? x.star : true))
    .filter((x) => !src || x.source === src)
    .filter((x) => !q || `${x.title} ${x.desc} ${x.author}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.updated.localeCompare(a.updated))

  const counts = { all: queries.length, mine: queries.filter((x) => x.author === 'Вы').length, star: queries.filter((x) => x.star).length }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-ink-800"><Code2 className="h-5 w-5 text-cyan-300" /></div>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-white">Запросы</h1>
            <p className="text-sm text-slate-400">SQL-запросы к источникам данных и диаграммы на их основе</p>
          </div>
        </div>
        <button onClick={create} className="btn-primary"><Plus className="h-4 w-4" /> Новый запрос</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {([['all', 'Все'], ['mine', 'Мои'], ['star', 'Избранные']] as const).map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={cx('rounded-xl border px-3.5 py-2 text-sm transition', tab === id ? 'border-violet-500/60 bg-violet-500/10 text-violet-200' : 'border-transparent bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]')}>
            {l} <span className="ml-1 text-slate-500">{counts[id]}</span>
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-white/[0.06] p-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input className="input pl-9" placeholder="Поиск по названию, описанию, автору" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input sm:w-56" value={src} onChange={(e) => setSrc(e.target.value)}>
            <option value="">Все источники</option>
            {sources.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[13px] text-slate-400">
                <th className="w-10 px-3 py-3" />
                <th className="px-3 py-3 font-medium">Название</th>
                <th className="px-3 py-3 font-medium">Источник</th>
                <th className="px-3 py-3 font-medium">Диаграммы</th>
                <th className="px-3 py-3 font-medium">Превью</th>
                <th className="px-3 py-3 font-medium">Автор</th>
                <th className="px-3 py-3 font-medium">Изменён</th>
                <th className="px-3 py-3 font-medium"><Eye className="h-4 w-4" /></th>
                <th className="w-12 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id} onClick={() => setOpen(x)} className="cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.02]">
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => upsert({ ...x, star: !x.star })} title="Избранное" className="rounded p-1 text-slate-500 hover:text-amber-400">
                      <Star className={cx('h-4 w-4', x.star && 'fill-amber-400 text-amber-400')} />
                    </button>
                  </td>
                  <td className="max-w-[340px] px-3 py-3">
                    <div className="truncate font-medium text-white">{x.title}</div>
                    <div className="truncate text-xs text-slate-500">{x.desc || 'Нет описания'}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 text-slate-300"><Database className="h-3.5 w-3.5 text-amber-400" /> {x.source}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {x.tabs.map((t) => {
                        const I = chartIcon[t.type]
                        return <span key={t.id} title={t.title} className="grid h-6 w-6 place-items-center rounded-md bg-white/[0.05] text-slate-300"><I className="h-3.5 w-3.5" /></span>
                      })}
                    </div>
                  </td>
                  <td className="px-3 py-2"><Spark q={x} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-300">{x.author}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-400">{fmtUpdated(x.updated)}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-400">{x.views}</td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button onClick={() => setMenu(menu === x.id ? null : x.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><MoreVertical className="h-4 w-4" /></button>
                      {menu === x.id && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />
                          <div className="absolute right-0 z-40 mt-1 w-44 rounded-xl border border-white/10 bg-ink-850 p-1 shadow-2xl">
                            <button onClick={() => { setOpen(x); setMenu(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"><Pencil className="h-4 w-4" /> Открыть</button>
                            <button onClick={() => { upsert({ ...x, id: 'q' + Date.now(), title: x.title + ' (копия)', author: 'Вы', views: 0, star: false, updated: new Date().toISOString() }); setMenu(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"><Copy className="h-4 w-4" /> Дублировать</button>
                            <button onClick={() => { setQueries((xs) => xs.filter((y) => y.id !== x.id)); setMenu(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-white/5"><Trash2 className="h-4 w-4" /> Удалить</button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-16 text-center text-sm text-slate-500">Запросов не найдено</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
