import { ReactNode } from 'react'
import { ExternalLink, Lock } from 'lucide-react'
import { cx } from '../../../components/ui'
import { Level, Status, teamLabel } from './data'

export type Tone = 'green' | 'amber' | 'violet' | 'slate' | 'red'
const tones: Record<Tone, string> = {
  green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  violet: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
  slate: 'border-white/[0.08] bg-white/[0.04] text-slate-400',
  red: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
}
export function Chip({ tone = 'slate', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 text-xs', tones[tone], className)}>{children}</span>
}

export function StatusChip({ s }: { s: Status }) {
  const map = { healthy: ['bg-emerald-400', 'Healthy', 'green'], warning: ['bg-amber-400', 'Degraded', 'amber'], stopped: ['bg-slate-500', 'Stopped', 'slate'] } as const
  const [dot, label, tone] = map[s]
  return <Chip tone={tone}><span className={cx('h-1.5 w-1.5 rounded-full', dot)} />{label}</Chip>
}

export const Kicker = ({ children }: { children: ReactNode }) => <div className="text-[13px] text-violet-300">{children}</div>

export function Note({ tone = 'slate', children, className }: { tone?: 'slate' | 'amber' | 'green'; children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-xl border px-3.5 py-3 text-[13px] leading-5', tone === 'amber' ? 'border-amber-500/20 bg-amber-500/[0.06] text-amber-200/90' : tone === 'green' ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200/90' : 'border-white/[0.07] bg-white/[0.02] text-slate-400', className)}>
      {children}
    </div>
  )
}

export function KV({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <div className="text-xs text-slate-500">{k}</div>
          <div className="mt-1 truncate text-sm text-white">{v}</div>
        </div>
      ))}
    </div>
  )
}

export function InfoRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] py-2 text-[13px] last:border-0">
      <span className="text-slate-500">{k}</span>
      <span className="min-w-0 truncate text-right text-white">{v}</span>
    </div>
  )
}

export function AccessButton({ team, role, label = 'Запросить доступ', onRequest, small }: { team: string; role: Level; label?: string; onRequest: (team: string, role: Level) => void; small?: boolean }) {
  return (
    <button type="button" onClick={() => onRequest(team, role)} className={cx('btn-ghost', small && 'px-2.5 py-1 text-xs')}>
      <ExternalLink className="h-3.5 w-3.5" /> {label}
    </button>
  )
}

export function MissingPermission({ team, role, reason, onRequest }: { team: string; role: Level; reason: string; onRequest: (team: string, role: Level) => void }) {
  return (
    <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Chip tone="amber"><Lock className="h-3 w-3" /> Недостаточно прав</Chip>
        <div className="mt-2.5 font-medium text-white">Для этого действия нужен доступ</div>
        <p className="mt-1 text-sm text-slate-400">
          {reason}
          <br />
          Команда: <span className="text-white">{teamLabel(team)}</span> · минимальная роль: <code className="font-mono text-violet-300">{team}:{role}</code>
        </p>
      </div>
      <AccessButton team={team} role={role} label="Оформить заявку" onRequest={onRequest} />
    </div>
  )
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
  )
}

export function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-ink-950 p-1">
      {options.map(([v, l]) => (
        <button key={v} type="button" onClick={() => onChange(v)} className={cx('rounded-lg px-3 py-1.5 text-[13px] transition-colors', value === v ? 'bg-ink-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]' : 'text-slate-400 hover:text-white')}>
          {l}
        </button>
      ))}
    </div>
  )
}

export function OptionCard({ active, onClick, icon, title, desc, disabled }: { active: boolean; onClick: () => void; icon: ReactNode; title: string; desc: string; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={cx('flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50', active ? 'border-violet-500/50 bg-violet-500/[0.08]' : 'border-white/[0.08] hover:border-white/15')}>
      <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-lg border', active ? 'border-violet-500/40 text-violet-300' : 'border-white/[0.08] text-slate-400')}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-white">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{desc}</span>
      </span>
      <span className={cx('mt-1 h-4 w-4 shrink-0 rounded-full border', active ? 'border-[5px] border-violet-500' : 'border-white/20')} />
    </button>
  )
}

export function RowTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mb-2.5 text-sm font-medium text-white', className)}>{children}</div>
}
