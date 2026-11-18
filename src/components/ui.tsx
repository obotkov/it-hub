import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  badge,
}: {
  title: string
  subtitle?: string
  icon?: LucideIcon
  actions?: ReactNode
  badge?: string
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-cyan-400/10">
            <Icon className="h-6 w-6 text-violet-300" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
            {badge && <Badge tone="violet">{badge}</Badge>}
          </div>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const tones = {
  slate: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
  green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  red: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
  cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
}
export type Tone = keyof typeof tones

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', tones[tone])}>
      {children}
    </span>
  )
}

export function StatusDot({ status }: { status: 'running' | 'stopped' | 'pending' | 'error' }) {
  const map = {
    running: ['bg-emerald-400', 'Работает'],
    stopped: ['bg-slate-500', 'Остановлен'],
    pending: ['bg-amber-400', 'Запуск'],
    error: ['bg-rose-500', 'Ошибка'],
  } as const
  const [c, l] = map[status]
  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-300">
      <span className={cx('h-2 w-2 rounded-full', c, status === 'running' && 'shadow-[0_0_8px] shadow-emerald-400')} />
      {l}
    </span>
  )
}

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <div className={cx('card p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Stat({ label, value, delta, icon: Icon }: { label: string; value: string; delta?: string; icon?: LucideIcon }) {
  const neg = delta?.startsWith('-')
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-slate-500" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-white">{value}</span>
        {delta && <span className={cx('text-xs font-medium', neg ? 'text-rose-400' : 'text-emerald-400')}>{delta}</span>}
      </div>
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-ink-900 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            'rounded-lg px-3 py-1.5 text-sm transition',
            value === t.id ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-slate-500">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-white/[0.04] transition hover:bg-white/[0.02]">
              {r.map((c, j) => (
                <td key={j} className="whitespace-nowrap px-3 py-3 text-slate-300">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={cx('card w-full animate-fadeup border-white/10 bg-ink-900 p-6 shadow-2xl', wide ? 'max-w-3xl' : 'max-w-lg')} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={cx('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-violet-500' : 'bg-ink-600')}
      aria-pressed={on}
    >
      <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

export function Range({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-sm text-white">
          {value} {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-violet-500" />
    </div>
  )
}

export function Empty({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      <Icon className="mb-3 h-8 w-8 text-slate-500" />
      <div className="font-medium text-white">{title}</div>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-ink-950 p-4 font-mono text-xs leading-relaxed text-slate-300">{children}</pre>
}
