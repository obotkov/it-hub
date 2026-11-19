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
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-ink-850">
            <Icon className="h-[18px] w-[18px] text-slate-400" strokeWidth={1.5} />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] font-medium leading-[1.15] text-white">{title}</h1>
            {badge && <Badge>{badge}</Badge>}
          </div>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// Quiet tags: neutral by default, colour only when it carries meaning.
const tones = {
  slate: 'bg-white/[0.04] text-slate-400 border-white/[0.08]',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  red: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  cyan: 'bg-white/[0.04] text-slate-400 border-white/[0.08]',
}
export type Tone = keyof typeof tones

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={cx('inline-flex h-5 items-center gap-1 rounded-md border px-1.5 text-xs', tones[tone])}>
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
      <span className={cx('h-2 w-2 rounded-full', c,)} />
      {l}
    </span>
  )
}

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <div className={cx('card p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex min-h-8 items-center justify-between gap-2">
          {title && <h3 className="text-[15px] font-medium text-white">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Stat({ label, value, delta }: { label: string; value: string; delta?: string; icon?: LucideIcon }) {
  const neg = /^[-−]/.test(delta ?? '')
  return (
    <div className="card p-5">
      <div className="text-[13px] text-slate-400">{label}</div>
      <div className="mt-3 text-[28px] font-medium leading-none tabular-nums text-white">{value}</div>
      {delta && <div className={cx('mt-2 text-xs tabular-nums', neg ? 'text-rose-400' : 'text-emerald-400')}>{delta}</div>}
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
            'rounded-lg px-3 py-1.5 text-sm transition-colors',
            value === t.id ? 'bg-ink-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]' : 'text-slate-400 hover:text-slate-200',
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
          <tr className="border-b border-white/[0.07] text-xs text-slate-500">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2.5 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]">
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
      <div className={cx('card w-full animate-fadeup border-white/10 bg-ink-900 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.4)]', wide ? 'max-w-3xl' : 'max-w-lg')} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
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
      className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-violet-600' : 'bg-ink-600')}
      aria-pressed={on}
    >
      <span className={cx('on-accent absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform', on && 'translate-x-5')} />
    </button>
  )
}

export function Range({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="meter rounded-md bg-white/5 px-2 py-0.5 text-sm text-white">
          {value} {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-violet-600" />
    </div>
  )
}

export function Empty({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      <Icon className="mb-3 h-6 w-6 text-slate-500" strokeWidth={1.5} />
      <div className="font-medium text-white">{title}</div>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-ink-950 p-4 font-mono text-xs leading-relaxed text-slate-300">{children}</pre>
}
