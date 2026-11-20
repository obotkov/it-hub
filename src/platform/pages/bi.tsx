import { ReactNode, useState } from 'react'
import { DatabaseZap, Plus, Upload, BellRing, Database, Mail, MessageSquare, Send, Search, ChevronDown, ChevronsUpDown, ListFilter, PlugZap, Loader2, Check, CircleCheck, CircleX, CirclePlay, CirclePause, Clock3, Users, Network, FileText, Sheet } from 'lucide-react'
import { Badge, Modal, PageHeader, Toggle, cx } from '../../components/ui'

const sourceTypes = [
  { n: 'PostgreSQL', c: '#60a5fa' }, { n: 'ClickHouse', c: '#facc15' }, { n: 'MySQL', c: '#38bdf8' }, { n: 'BigQuery', c: '#4ade80' },
  { n: 'Greenplum', c: '#34d399' }, { n: 'Wildmetrics', c: '#fb923c' }, { n: 'Google Sheets', c: '#22c55e' }, { n: 'CSV / Excel', c: '#a78bfa' },
]

type SrcStatus = 'ok' | 'error'
type Source = { name: string; type: string; host: string; envs: string[]; owners: number; status: SrcStatus; run: number; paused: number; limit: number }

const envTone: Record<string, string> = {
  'prod-positions': 'border-red-500/25 bg-red-500/15 text-red-300',
  'Реклама': 'border-yellow-500/25 bg-yellow-500/15 text-yellow-300',
  'Маркетинг EU': 'border-rose-500/25 bg-rose-500/15 text-rose-300',
  'Финансы': 'border-emerald-500/25 bg-emerald-500/15 text-emerald-300',
  'Проектные метрики': 'border-violet-500/25 bg-violet-500/15 text-violet-300',
  'Метрики HR': 'border-amber-500/25 bg-amber-500/15 text-amber-300',
  'Рекомендации': 'border-green-500/25 bg-green-500/15 text-green-300',
  'Песочница': 'border-white/10 bg-white/[0.06] text-slate-300',
}

const initialSources: Source[] = [
  { name: 'analytics-ch-03', type: 'ClickHouse', host: 'analytics-ch-03.dc1.it-hub.ru', envs: ['prod-positions'], owners: 2, status: 'ok', run: 1, paused: 0, limit: 15 },
  { name: 'analytics-ch-02', type: 'ClickHouse', host: 'analytics-ch-02.dc1.it-hub.ru', envs: ['prod-positions'], owners: 2, status: 'ok', run: 0, paused: 0, limit: 15 },
  { name: 'analytics-ch-01', type: 'ClickHouse', host: 'analytics-ch-01.dc1.it-hub.ru', envs: ['prod-positions'], owners: 2, status: 'ok', run: 3, paused: 1, limit: 15 },
  { name: 'budget_2026.xlsx', type: 'CSV / Excel', host: '', envs: ['Финансы'], owners: 3, status: 'ok', run: 0, paused: 0, limit: 0 },
  { name: 'ads events', type: 'ClickHouse', host: 'tcp://ads-ch.service.consul:9000', envs: ['Реклама', 'Маркетинг EU', 'Песочница'], owners: 3, status: 'ok', run: 2, paused: 0, limit: 7 },
  { name: 'recsys_gp_hr', type: 'Greenplum', host: 'gp-pgbouncer.k8s.prod-dc1', envs: ['Проектные метрики'], owners: 3, status: 'error', run: 0, paused: 2, limit: 15 },
  { name: 'recsys_gp_master', type: 'Greenplum', host: 'gp-recsys-master.dc1.it-hub.ru', envs: ['Метрики HR'], owners: 4, status: 'error', run: 0, paused: 0, limit: 15 },
  { name: 'gp_rec_project', type: 'Greenplum', host: 'recommendations-dwh-greenplum-01-master.dc1.it-hub.ru', envs: ['Рекомендации'], owners: 1, status: 'ok', run: 4, paused: 0, limit: 15 },
  { name: 'prod-postgres', type: 'PostgreSQL', host: 'pg-main.dc1.it-hub.ru:5432', envs: ['Финансы', 'Проектные метрики'], owners: 2, status: 'ok', run: 0, paused: 0, limit: 10 },
  { name: 'wildmetrics', type: 'Wildmetrics', host: 'api.wildmetrics.ru', envs: ['Маркетинг EU'], owners: 1, status: 'ok', run: 1, paused: 0, limit: 5 },
]

function TypeIcon({ type }: { type: string }) {
  const meta = sourceTypes.find((t) => t.n === type)
  const color = meta?.c ?? '#a1a1aa'
  if (type === 'ClickHouse')
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-label={type}>
        {[1, 4, 7, 10].map((x) => <rect key={x} x={x} y="2" width="2" height="12" rx="0.5" fill={color} />)}
        <rect x="13" y="6.5" width="2" height="3" rx="0.5" fill={color} />
      </svg>
    )
  const Icon = type === 'CSV / Excel' ? FileText : type === 'Google Sheets' ? Sheet : Database
  return <Icon className="h-4 w-4" style={{ color }} aria-label={type} />
}

function Envs({ envs }: { envs: string[] }) {
  const shown = envs.slice(0, 2)
  const rest = envs.length - shown.length
  return (
    <div className="flex items-center gap-1.5">
      {shown.map((e) => (
        <span key={e} className={cx('inline-flex h-6 items-center whitespace-nowrap rounded-md border px-2 text-xs', envTone[e] ?? envTone['Песочница'])}>{e}</span>
      ))}
      {rest > 0 && <span title={envs.slice(2).join(', ')} className="inline-flex h-6 items-center rounded-md border border-white/10 bg-white/[0.06] px-1.5 text-xs text-slate-300">+{rest}</span>}
    </div>
  )
}

function Queue({ run, paused, limit }: { run: number; paused: number; limit: number }) {
  const pill = 'inline-flex h-6 items-center gap-1 rounded-md px-1.5 meter text-xs'
  return (
    <div className="flex items-center gap-1">
      <span title="Выполняется" className={cx(pill, run ? 'text-emerald-300' : 'text-emerald-400/50')}><CirclePlay className="h-3.5 w-3.5" />{run}</span>
      <span title="На паузе" className={cx(pill, paused ? 'text-amber-300' : 'text-emerald-400/50')}><CirclePause className="h-3.5 w-3.5" />{paused}</span>
      <span title="Лимит параллельных запросов" className={cx(pill, 'bg-white/[0.06] text-slate-300')}><Clock3 className="h-3.5 w-3.5" />{limit}</span>
    </div>
  )
}

type SortKey = 'default' | 'name' | 'host' | 'status'
const sortLabels: Record<SortKey, string> = { default: 'по умолчанию', name: 'по названию', host: 'по хосту', status: 'по статусу' }

export function BiSources() {
  const [modal, setModal] = useState(false)
  const [sources, setSources] = useState<Source[]>(initialSources)
  const [picked, setPicked] = useState('PostgreSQL')
  const [newName, setNewName] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('default')
  const [dir, setDir] = useState<1 | -1>(1)
  const [sortMenu, setSortMenu] = useState(false)
  const [filterMenu, setFilterMenu] = useState(false)
  const [types, setTypes] = useState<string[]>([])
  const [onlyErrors, setOnlyErrors] = useState(false)
  const [checking, setChecking] = useState(false)

  const presentTypes = [...new Set(sources.map((s) => s.type))]
  const query = q.trim().toLowerCase()
  const list = sources
    .filter((s) => !query || [s.name, s.host, ...s.envs].some((v) => v.toLowerCase().includes(query)))
    .filter((s) => !types.length || types.includes(s.type))
    .filter((s) => !onlyErrors || s.status === 'error')
  if (sort !== 'default') {
    list.sort((a, b) => {
      const av = sort === 'status' ? a.status : a[sort]
      const bv = sort === 'status' ? b.status : b[sort]
      return av.localeCompare(bv, 'ru') * dir
    })
  }
  const toggleSort = (k: 'name' | 'host') => {
    if (sort === k) setDir((d) => (d === 1 ? -1 : 1))
    else { setSort(k); setDir(1) }
  }
  const filtersOn = types.length > 0 || onlyErrors
  const check = () => {
    setChecking(true)
    setTimeout(() => setChecking(false), 1200)
  }

  const SortHead = ({ k, children }: { k: 'name' | 'host'; children: ReactNode }) => (
    <button onClick={() => toggleSort(k)} className="flex w-full items-center justify-between gap-2 text-left hover:text-white">
      {children}
      <ChevronsUpDown className={cx('h-3.5 w-3.5 shrink-0', sort === k ? 'text-violet-400' : 'text-slate-600')} />
    </button>
  )

  return (
    <>
      <PageHeader title="Источники данных" subtitle="Подключайте базы данных и загружайте файлы — всё становится доступно для запросов и дашбордов." icon={DatabaseZap} />

      <div className="card mb-3 flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
        <div className="relative flex min-w-0 flex-1 items-center rounded-lg border border-white/[0.08] bg-ink-950 focus-within:border-violet-500/50">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" className="h-10 min-w-0 flex-1 bg-transparent pl-9 pr-2 text-sm text-white outline-none placeholder:text-slate-500" />
          <div className="relative shrink-0">
            <button onClick={() => setSortMenu((v) => !v)} className="flex h-10 items-center gap-1 whitespace-nowrap px-3 text-sm text-slate-400 hover:text-white">
              <span className="hidden sm:inline">Сортировать</span> <span className="text-slate-300">{sortLabels[sort]}</span> <ChevronDown className="h-4 w-4" />
            </button>
            {sortMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSortMenu(false)} />
                <div className="absolute right-0 z-40 mt-1 w-48 animate-fadeup rounded-xl border border-white/[0.08] bg-ink-850 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                  {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                    <button key={k} onClick={() => { setSort(k); setDir(1); setSortMenu(false) }} className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white">
                      {sortLabels[k]} {sort === k && <Check className="h-4 w-4 text-violet-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setFilterMenu((v) => !v)} title="Фильтры" className={cx('btn-ghost h-10 w-10 justify-center p-0', filtersOn && 'text-violet-400')}>
              <ListFilter className="h-4 w-4" />
            </button>
            {filterMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setFilterMenu(false)} />
                <div className="absolute right-0 z-40 mt-1 w-56 animate-fadeup rounded-xl border border-white/[0.08] bg-ink-850 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                  <div className="px-2.5 pb-1 pt-1.5 text-xs text-slate-500">Тип</div>
                  {presentTypes.map((t) => (
                    <button key={t} onClick={() => setTypes((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white">
                      <TypeIcon type={t} /> <span className="flex-1">{t}</span> {types.includes(t) && <Check className="h-4 w-4 text-violet-400" />}
                    </button>
                  ))}
                  <div className="my-1 border-t border-white/[0.06]" />
                  <button onClick={() => setOnlyErrors((v) => !v)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white">
                    <CircleX className="h-4 w-4 text-red-400" /> <span className="flex-1">Только с ошибкой</span> {onlyErrors && <Check className="h-4 w-4 text-violet-400" />}
                  </button>
                  {filtersOn && (
                    <button onClick={() => { setTypes([]); setOnlyErrors(false) }} className="w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-500 hover:text-white">Сбросить</button>
                  )}
                </div>
              </>
            )}
          </div>
          <button onClick={check} title="Проверить подключения" className="btn-ghost h-10 w-10 justify-center p-0">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
          </button>
          <button onClick={() => setModal(true)} className="btn-primary h-10 flex-1 whitespace-nowrap sm:flex-none"><Plus className="h-4 w-4" /> Новое подключение</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] text-[13px] text-slate-400">
                <th className="w-14 py-3 pl-4 font-normal" />
                <th className="w-12 border-l border-white/[0.05] py-3 font-normal" />
                <th className="w-[19%] px-3 py-3 font-normal"><SortHead k="name">Название</SortHead></th>
                <th className="w-[24%] border-l border-white/[0.05] px-3 py-3 font-normal"><SortHead k="host">Хост</SortHead></th>
                <th className="border-l border-white/[0.05] px-3 py-3 font-normal">
                  <span className="flex items-center justify-between gap-2">Окружения <Network className="h-3.5 w-3.5 text-slate-600" /></span>
                </th>
                <th className="w-32 border-l border-white/[0.05] px-3 py-3 font-normal">Ответственные</th>
                <th className="w-44 border-l border-white/[0.05] px-3 py-3 font-normal">Очередь</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.name} className="cursor-pointer border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.03]">
                  <td className="py-3 pl-4"><span title={s.type} className="grid place-items-center"><TypeIcon type={s.type} /></span></td>
                  <td className="py-3">
                    <span className="grid place-items-center">
                      {checking ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : s.status === 'ok' ? <CircleCheck className="h-4 w-4 text-emerald-400" aria-label="Доступен" /> : <CircleX className="h-4 w-4 text-red-400" aria-label="Нет соединения" />}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-white">{s.name}</td>
                  <td className="max-w-0 px-3 py-3"><span title={s.host} className="block truncate text-slate-300">{s.host || <span className="text-slate-600">—</span>}</span></td>
                  <td className="px-3 py-3"><Envs envs={s.envs} /></td>
                  <td className="px-3 py-3"><span className="flex items-center gap-1.5 text-slate-300"><Users className="h-4 w-4 text-slate-500" /><span className="meter">{s.owners}</span></span></td>
                  <td className="px-3 py-3"><Queue run={s.run} paused={s.paused} limit={s.limit} /></td>
                </tr>
              ))}
              {!list.length && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">Ничего не найдено</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Новое подключение" wide>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {sourceTypes.map((t) => (
            <button key={t.n} onClick={() => setPicked(t.n)} className={cx('flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition', picked === t.n ? 'border-violet-500/60 bg-violet-500/10 text-white' : 'border-white/10 text-slate-300 hover:border-white/20')}>
              <TypeIcon type={t.n} /> {t.n}
            </button>
          ))}
        </div>
        <div className="mt-5"><label className="label">Название</label><input value={newName} onChange={(e) => setNewName(e.target.value)} className="input" placeholder="analytics-ch-04" /></div>
        {picked === 'CSV / Excel' || picked === 'Google Sheets' ? (
          <label className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 p-8 text-sm text-slate-400 hover:border-violet-500/50">
            <Upload className="h-6 w-6" /> Загрузите файл CSV, XLSX или вставьте ссылку на таблицу
            <input type="file" hidden />
          </label>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><label className="label">Хост</label><input className="input font-mono" placeholder="db.example.ru" /></div>
            <div><label className="label">Порт</label><input className="input font-mono" placeholder={picked === 'ClickHouse' ? '8443' : '5432'} /></div>
            <div><label className="label">База</label><input className="input font-mono" placeholder="analytics" /></div>
            <div><label className="label">Пользователь</label><input className="input font-mono" placeholder="readonly" /></div>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setModal(false)} className="btn-ghost">Отмена</button>
          <button
            onClick={() => {
              const name = newName.trim() || `new-${picked.toLowerCase().replace(/\W/g, '')}`
              const file = picked === 'CSV / Excel' || picked === 'Google Sheets'
              setSources((s) => [{ name, type: picked, host: file ? '' : 'db.example.ru', envs: ['Песочница'], owners: 1, status: 'ok', run: 0, paused: 0, limit: file ? 0 : 10 }, ...s])
              setNewName('')
              setModal(false)
            }}
            className="btn-primary"
          >
            Подключить
          </button>
        </div>
      </Modal>
    </>
  )
}

export function BiAlerts() {
  const [alerts, setAlerts] = useState([
    { name: 'Падение выручки > 20%', cond: 'revenue_day < avg_7d × 0.8', ch: 'Telegram', on: true, last: 'не срабатывал' },
    { name: 'Ошибки оплаты', cond: 'payment_errors > 50 / час', ch: 'Slack', on: true, last: '14.11 03:12' },
    { name: 'Еженедельный отчёт', cond: 'каждый пн 09:00', ch: 'Email', on: true, last: '17.11 09:00' },
    { name: 'Рост отказов', cond: 'bounce_rate > 45%', ch: 'Email', on: false, last: '—' },
  ])
  const [modal, setModal] = useState(false)
  const icon = (c: string) => (c === 'Email' ? <Mail className="h-4 w-4" /> : c === 'Slack' ? <MessageSquare className="h-4 w-4" /> : <Send className="h-4 w-4" />)
  return (
    <>
      <PageHeader title="Алерты и уведомления" subtitle="Получайте уведомления, когда метрики выходят за пороги, и отчёты по расписанию." icon={BellRing} actions={<button onClick={() => setModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> Алерт</button>} />
      <div className="space-y-3">
        {alerts.map((a, i) => (
          <div key={a.name} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="font-medium text-white">{a.name}</div>
              <div className="mt-0.5 font-mono text-xs text-slate-500">{a.cond}</div>
            </div>
            <Badge tone="cyan">{icon(a.ch)} {a.ch}</Badge>
            <span className="w-36 text-xs text-slate-500">Последний: {a.last}</span>
            <Toggle on={a.on} onChange={(v) => setAlerts((x) => x.map((y, j) => (j === i ? { ...y, on: v } : y)))} />
          </div>
        ))}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Новый алерт">
        <div className="space-y-4">
          <div><label className="label">Название</label><input className="input" placeholder="Например: аномалия трафика" /></div>
          <div className="grid grid-cols-3 gap-2">
            <select className="input"><option>revenue</option><option>orders</option><option>visits</option></select>
            <select className="input"><option>&lt;</option><option>&gt;</option><option>изменение %</option></select>
            <input className="input" placeholder="1000" />
          </div>
          <div><label className="label">Канал</label><select className="input"><option>Telegram</option><option>Email</option><option>Slack</option><option>Webhook</option></select></div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(false)} className="btn-ghost">Отмена</button>
            <button onClick={() => { setAlerts((x) => [...x, { name: 'Новый алерт', cond: 'revenue < 1000', ch: 'Telegram', on: true, last: '—' }]); setModal(false) }} className="btn-primary">Создать</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
