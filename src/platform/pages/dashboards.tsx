import { useEffect, useState } from 'react'
import {
  ArrowLeft, Pencil, Star, User, BookOpen, Eye, Lock, Link2, MoreVertical, Save, Plus, Search, LayoutDashboard, Copy, Trash2, RefreshCw,
  Hash, LineChart as LineIcon, PieChart, BarChart3, Maximize2, Minimize2, Calendar,
} from 'lucide-react'
import { Badge, Modal, cx } from '../../components/ui'
import { BarChart, Donut, LineChart, days, series } from '../../components/charts'

/* ============================== model ============================== */

type WType = 'stat' | 'line' | 'bar' | 'donut'
type Widget = { id: string; type: WType; title: string; span: 1 | 2 | 3 | 4; seed: number; value?: string; delta?: string; cats?: string[] }
type Dashboard = { id: string; title: string; desc: string; author: string; updated: string; views: number; star: boolean; widgets: Widget[] }

const PALETTE = ['#22d3ee', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#60a5fa', '#94a3b8']

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many
}
const ago = (h: number) => new Date(Date.now() - h * 3600e3).toISOString()
const pad2 = (n: number) => String(n).padStart(2, '0')
const fmtUpdated = (iso: string) => {
  const h = (Date.now() - new Date(iso).getTime()) / 3600e3
  if (h < 1 / 60) return 'только что'
  if (h < 1) return `${Math.round(h * 60)} мин назад`
  if (h < 24) return `${Math.round(h)} ч назад`
  const d = new Date(iso)
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`
}

let wid = 0
const w = (type: WType, title: string, span: Widget['span'], extra: Partial<Widget> = {}): Widget => ({ id: `w${++wid}`, type, title, span, seed: wid * 7 + 3, ...extra })

const DEMO: Dashboard[] = [
  {
    id: 'd1', title: 'Продажи', desc: 'Выручка, заказы и категории товаров', author: 'Вы', updated: ago(3), views: 214, star: true,
    widgets: [
      w('stat', 'Выручка', 1, { value: '18.4M ₽', delta: '+11%' }),
      w('stat', 'Заказы', 1, { value: '7 812', delta: '+6%' }),
      w('stat', 'Средний чек', 1, { value: '2 356 ₽', delta: '+4%' }),
      w('stat', 'Возвраты', 1, { value: '2.1%', delta: '-0.3%' }),
      w('line', 'Выручка по дням', 3),
      w('donut', 'Категории', 1, { cats: ['Электроника', 'Одежда', 'Дом', 'Прочее'] }),
      w('bar', 'По регионам', 4, { cats: ['Москва', 'СПб', 'Новосиб.', 'Екб', 'Казань', 'Краснодар', 'Самара', 'Н.Новгород'] }),
    ],
  },
  {
    id: 'd2', title: 'Продуктовые метрики', desc: 'DAU, MAU, удержание и платформы', author: 'Анна Смирнова', updated: ago(26), views: 98, star: false,
    widgets: [
      w('stat', 'DAU', 1, { value: '64K', delta: '+3%' }),
      w('stat', 'MAU', 1, { value: '512K', delta: '+9%' }),
      w('stat', 'Stickiness', 1, { value: '12.5%', delta: '-0.4%' }),
      w('stat', 'NPS', 1, { value: '47', delta: '+2' }),
      w('line', 'Активные пользователи', 3),
      w('donut', 'Платформы', 1, { cats: ['Web', 'iOS', 'Android'] }),
      w('bar', 'Использование фич', 2, { cats: ['Поиск', 'Корзина', 'Избранное', 'Отзывы', 'Чат'] }),
      w('line', 'Retention D7', 2),
    ],
  },
  {
    id: 'd3', title: 'Мониторинг событий', desc: 'Потерянные события и ошибки трекинга', author: 'Вы', updated: ago(1), views: 37, star: true,
    widgets: [
      w('stat', 'Событий за сутки', 1, { value: '9.2M', delta: '+4%' }),
      w('stat', 'Потеряно', 1, { value: '1.4%', delta: '+0.2%' }),
      w('line', 'Доля потерянных событий', 2),
      w('line', 'Ошибки отправки', 2),
      w('bar', 'По платформам', 2, { cats: ['Android', 'iOS', 'Web', 'Desktop'] }),
    ],
  },
  {
    id: 'd4', title: 'Маркетинг', desc: 'Каналы привлечения и стоимость', author: 'Илья Петров', updated: ago(70), views: 156, star: false,
    widgets: [
      w('stat', 'Новые пользователи', 1, { value: '38 412', delta: '+16%' }),
      w('stat', 'CAC', 1, { value: '412 ₽', delta: '-8%' }),
      w('stat', 'ROMI', 1, { value: '238%', delta: '+12%' }),
      w('stat', 'CTR', 1, { value: '3.4%', delta: '+0.2%' }),
      w('donut', 'Каналы', 2, { cats: ['Поиск', 'Соцсети', 'Реклама', 'Прямые', 'Email'] }),
      w('line', 'Привлечение по дням', 2),
    ],
  },
  {
    id: 'd5', title: 'Финансы', desc: 'P&L и расходы по статьям', author: 'Мария Кузнецова', updated: ago(160), views: 22, star: false,
    widgets: [
      w('stat', 'Выручка', 1, { value: '54.1M ₽', delta: '+9%' }),
      w('stat', 'EBITDA', 1, { value: '8.7M ₽', delta: '+3%' }),
      w('bar', 'Расходы по статьям', 2, { cats: ['ФОТ', 'Маркетинг', 'Инфра', 'Аренда', 'Прочее'] }),
      w('line', 'Денежный поток', 4),
    ],
  },
]

const load = (): Dashboard[] => {
  try {
    return JSON.parse(localStorage.getItem('hub.dashboards') || 'null') ?? DEMO
  } catch {
    return DEMO
  }
}

const typeMeta: Record<WType, { label: string; icon: typeof Hash }> = {
  stat: { label: 'Число', icon: Hash },
  line: { label: 'График', icon: LineIcon },
  bar: { label: 'Столбцы', icon: BarChart3 },
  donut: { label: 'Круговая', icon: PieChart },
}

const spanCls: Record<number, string> = { 1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4' }

/* ============================== widget ============================== */

function WidgetCard({ wd, period, onRemove, onResize }: { wd: Widget; period: number; onRemove: () => void; onResize: () => void }) {
  const [menu, setMenu] = useState(false)
  const neg = wd.delta?.startsWith('-')
  return (
    <div className={cx('card relative p-4', wd.type === 'stat' ? 'sm:col-span-1' : 'sm:col-span-2', spanCls[wd.span])}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className={cx('text-sm', wd.type === 'stat' ? 'text-slate-400' : 'font-semibold text-white')}>{wd.title}</h3>
        <div className="relative">
          <button onClick={() => setMenu(!menu)} className="-mr-1 -mt-1 rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-white"><MoreVertical className="h-4 w-4" /></button>
          {menu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
              <div className="absolute right-0 z-40 mt-1 w-44 rounded-xl border border-white/10 bg-ink-850 p-1 shadow-2xl">
                <button onClick={() => { onResize(); setMenu(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5">
                  {wd.span === 4 ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />} {wd.span === 4 ? 'Уменьшить' : 'Шире'}
                </button>
                <button onClick={() => { onRemove(); setMenu(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-white/5"><Trash2 className="h-4 w-4" /> Удалить</button>
              </div>
            </>
          )}
        </div>
      </div>
      {wd.type === 'stat' && (
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums text-white">{wd.value ?? '—'}</span>
          {wd.delta && <span className={cx('text-xs font-medium', neg ? 'text-rose-400' : 'text-emerald-400')}>{wd.delta}</span>}
        </div>
      )}
      {wd.type === 'line' && (
        <LineChart
          labels={days(period)}
          series={[
            { name: 'Текущий период', data: series(period, 400 + (wd.seed % 7) * 60, 260, wd.seed), color: PALETTE[wd.seed % 6] },
            { name: 'Прошлый период', data: series(period, 340 + (wd.seed % 5) * 50, 220, wd.seed + 4), color: '#64748b' },
          ]}
        />
      )}
      {wd.type === 'bar' && (
        <BarChart color={PALETTE[wd.seed % 6]} data={(wd.cats ?? ['A', 'B', 'C']).map((l, i) => ({ label: l, value: Math.round(900 / (i + 1) + ((wd.seed * (i + 3)) % 120)) }))} />
      )}
      {wd.type === 'donut' && (
        <Donut data={(wd.cats ?? ['A', 'B']).map((l, i, a) => ({ label: l, value: Math.round(100 / (i + 1.4)) + ((wd.seed + i) % 9) + (a.length - i), color: PALETTE[i % PALETTE.length] }))} />
      )}
    </div>
  )
}

/* ============================== dashboard view ============================== */

function DashboardView({ d, onBack, onSave }: { d: Dashboard; onBack: (d: Dashboard) => void; onSave: (d: Dashboard) => void }) {
  const [title, setTitle] = useState(d.title)
  const [editTitle, setEditTitle] = useState(false)
  const [desc, setDesc] = useState(d.desc)
  const [editDesc, setEditDesc] = useState(false)
  const [star, setStar] = useState(d.star)
  const [widgets, setWidgets] = useState<Widget[]>(d.widgets)
  const [period, setPeriod] = useState(30)
  const [add, setAdd] = useState(false)
  const [access, setAccess] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [refreshed, setRefreshed] = useState(new Date())
  const [nw, setNw] = useState<{ type: WType; title: string; span: Widget['span'] }>({ type: 'line', title: '', span: 2 })

  useEffect(() => {
    document.querySelector('main')?.scrollTo(0, 0)
  }, [])

  const changed = () => JSON.stringify([title, desc, star, widgets]) !== JSON.stringify([d.title, d.desc, d.star, d.widgets])
  const snapshot = (): Dashboard => (changed() ? { ...d, title: title || 'Без названия', desc, star, widgets, updated: new Date().toISOString() } : d)
  const flash = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 1800)
  }

  return (
    <div className="-m-4 flex min-h-[calc(100vh-4rem)] flex-col gap-3 p-3 sm:-m-6 lg:-m-8">
      <div className="card flex items-center gap-3 px-4 py-3">
        <button onClick={() => onBack(snapshot())} title="К списку дашбордов" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
        {editTitle ? (
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => setEditTitle(false)} onKeyDown={(e) => e.key === 'Enter' && setEditTitle(false)} className="input max-w-md py-1 text-lg font-semibold" />
        ) : (
          <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight text-white">{title || 'Без названия'}</h1>
        )}
        <button onClick={() => setEditTitle(true)} title="Переименовать" className="rounded-lg p-1 text-slate-500 hover:text-white"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => setStar(!star)} title="В избранное" className="rounded-lg p-1 text-slate-500 hover:text-amber-400"><Star className={cx('h-4 w-4', star && 'fill-amber-400 text-amber-400')} /></button>
        <span title={`Владелец: ${d.author}`} className="p-1 text-slate-500"><User className="h-4 w-4" /></span>
        {editDesc ? (
          <input autoFocus value={desc} placeholder="Описание" onChange={(e) => setDesc(e.target.value)} onBlur={() => setEditDesc(false)} onKeyDown={(e) => e.key === 'Enter' && setEditDesc(false)} className="input w-64 py-1 text-sm" />
        ) : (
          <button onClick={() => setEditDesc(true)} className={cx('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1 text-xs', desc ? 'bg-white/[0.05] text-slate-300' : 'bg-amber-500/10 text-amber-500')}>
            <BookOpen className="h-3.5 w-3.5" /> {desc ? (desc.length > 24 ? desc.slice(0, 24) + '…' : desc) : 'Нет описания'}
          </button>
        )}
        <span className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/[0.05] px-2 py-1 text-xs text-slate-300 xl:inline-flex"><Eye className="h-3.5 w-3.5" /> {d.views} за всё время</span>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {msg && <span className="text-xs text-emerald-400">{msg}</span>}
          <button onClick={() => setAccess(true)} className="btn-ghost"><Lock className="h-4 w-4" /> Доступы</button>
          <button onClick={() => { navigator.clipboard?.writeText(location.href).catch(() => {}); flash('Ссылка скопирована') }} title="Скопировать ссылку" className="btn-ghost px-2.5"><Link2 className="h-4 w-4" /></button>
          <button onClick={() => { onSave(snapshot()); flash('Сохранено') }} className="btn-primary"><Save className="h-4 w-4" /> Сохранить</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900 px-3 py-1.5 text-sm">
          <Calendar className="h-4 w-4 text-slate-500" />
          <select value={period} onChange={(e) => setPeriod(+e.target.value)} className="bg-transparent text-slate-200 outline-none">
            <option value={7}>Последние 7 дней</option>
            <option value={30}>Последние 30 дней</option>
            <option value={90}>Последние 90 дней</option>
          </select>
        </div>
        <button onClick={() => setRefreshed(new Date())} className="btn-ghost py-1.5"><RefreshCw className="h-4 w-4" /> Обновить</button>
        <span className="text-xs text-slate-500">Данные на {pad2(refreshed.getHours())}:{pad2(refreshed.getMinutes())}</span>
        <button onClick={() => setAdd(true)} className="btn-primary ml-auto py-1.5"><Plus className="h-4 w-4" /> Виджет</button>
      </div>

      {widgets.length === 0 ? (
        <div className="card flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
          <LayoutDashboard className="h-8 w-8 text-slate-500" />
          <div className="font-medium text-white">Дашборд пуст</div>
          <p className="text-sm text-slate-400">Добавьте первый виджет: число, график или диаграмму.</p>
          <button onClick={() => setAdd(true)} className="btn-primary"><Plus className="h-4 w-4" /> Добавить виджет</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {widgets.map((wd) => (
            <WidgetCard
              key={wd.id}
              wd={wd}
              period={period}
              onRemove={() => setWidgets((x) => x.filter((y) => y.id !== wd.id))}
              onResize={() => setWidgets((x) => x.map((y) => (y.id === wd.id ? { ...y, span: (y.span === 4 ? 1 : y.span + 1) as Widget['span'] } : y)))}
            />
          ))}
        </div>
      )}

      <Modal open={add} onClose={() => setAdd(false)} title="Новый виджет">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(typeMeta) as WType[]).map((t) => {
              const I = typeMeta[t].icon
              return (
                <button key={t} onClick={() => setNw({ ...nw, type: t, span: t === 'stat' ? 1 : nw.span })} className={cx('flex flex-col items-center gap-2 rounded-xl border p-3 text-sm', nw.type === t ? 'border-violet-500/60 bg-violet-500/10 text-violet-200' : 'border-white/10 text-slate-300 hover:border-white/20')}>
                  <I className="h-5 w-5" /> {typeMeta[t].label}
                </button>
              )
            })}
          </div>
          <div><label className="label">Заголовок</label><input className="input" value={nw.title} onChange={(e) => setNw({ ...nw, title: e.target.value })} placeholder="Например: Конверсия в заказ" /></div>
          <div>
            <label className="label">Источник</label>
            <select className="input"><option>Запрос: Потерянные события, мониторинг 15 мин</option><option>Запрос: Брошенные корзины</option><option>Запрос: Ошибки оплаты по часам</option></select>
          </div>
          <div>
            <label className="label">Ширина</label>
            <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/[0.06] bg-ink-900 p-1">
              {([1, 2, 3, 4] as const).map((s) => (
                <button key={s} onClick={() => setNw({ ...nw, span: s })} className={cx('rounded-lg py-1.5 text-xs', nw.span === s ? 'bg-white/10 text-white' : 'text-slate-400')}>{s === 4 ? 'Вся строка' : `${s}/4`}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdd(false)} className="btn-ghost">Отмена</button>
            <button
              onClick={() => {
                const seed = Math.floor(Math.random() * 90) + 5
                setWidgets((x) => [
                  ...x,
                  {
                    id: 'w' + Date.now(), type: nw.type, title: nw.title || typeMeta[nw.type].label, span: nw.span, seed,
                    ...(nw.type === 'stat' ? { value: (1000 + seed * 137).toLocaleString('ru-RU'), delta: `+${seed % 12}%` } : {}),
                    ...(nw.type === 'bar' || nw.type === 'donut' ? { cats: ['Web', 'iOS', 'Android', 'Desktop'] } : {}),
                  },
                ])
                setNw({ type: 'line', title: '', span: 2 })
                setAdd(false)
              }}
              className="btn-primary"
            >
              Добавить
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={access} onClose={() => setAccess(false)} title="Доступы">
        <div className="space-y-3">
          {[[d.author, 'Владелец'], ['Команда аналитики', 'Редактор'], ['Все в кабинете', 'Просмотр']].map(([who, role]) => (
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

/* ============================== list ============================== */

function Thumb({ d }: { d: Dashboard }) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-xl bg-ink-850 p-2">
      {d.widgets.slice(0, 8).map((wd) => {
        const I = typeMeta[wd.type].icon
        return (
          <div key={wd.id} className={cx('grid place-items-center rounded-md bg-white/[0.05]', wd.type === 'stat' ? 'h-6' : 'h-12', { 1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4' }[wd.span])}>
            <I className="h-3.5 w-3.5" style={{ color: wd.type === 'stat' ? '#64748b' : PALETTE[wd.seed % 6] }} />
          </div>
        )
      })}
    </div>
  )
}

export function BiDashboards() {
  const [items, setItems] = useState<Dashboard[]>(load)
  const [open, setOpen] = useState<Dashboard | null>(null)
  const [tab, setTab] = useState<'all' | 'mine' | 'star'>('all')
  const [q, setQ] = useState('')
  const [menu, setMenu] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem('hub.dashboards', JSON.stringify(items))
    } catch {
      /* ignore */
    }
  }, [items])

  const upsert = (x: Dashboard) => setItems((xs) => (xs.some((y) => y.id === x.id) ? xs.map((y) => (y.id === x.id ? x : y)) : [x, ...xs]))

  if (open)
    return (
      <DashboardView
        key={open.id}
        d={open}
        onSave={upsert}
        onBack={(x) => {
          upsert(x)
          setOpen(null)
        }}
      />
    )

  const create = () => setOpen({ id: 'd' + Date.now(), title: 'Новый дашборд', desc: '', author: 'Вы', updated: new Date().toISOString(), views: 0, star: false, widgets: [] })

  const list = items
    .filter((x) => (tab === 'mine' ? x.author === 'Вы' : tab === 'star' ? x.star : true))
    .filter((x) => !q || `${x.title} ${x.desc} ${x.author}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.updated.localeCompare(a.updated))
  const counts = { all: items.length, mine: items.filter((x) => x.author === 'Вы').length, star: items.filter((x) => x.star).length }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-blue-500/10"><LayoutDashboard className="h-5 w-5 text-cyan-300" /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Дашборды</h1>
            <p className="text-sm text-slate-400">Отчёты из виджетов на основе запросов</p>
          </div>
        </div>
        <button onClick={create} className="btn-primary"><Plus className="h-4 w-4" /> Новый дашборд</button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {([['all', 'Все'], ['mine', 'Мои'], ['star', 'Избранные']] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} className={cx('rounded-xl border px-3.5 py-2 text-sm transition', tab === id ? 'border-violet-500/60 bg-violet-500/10 text-violet-200' : 'border-transparent bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]')}>
              {l} <span className="ml-1 text-slate-500">{counts[id]}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="input pl-9" placeholder="Поиск дашбордов" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card py-16 text-center text-sm text-slate-500">Дашбордов не найдено</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((x) => (
            <div key={x.id} onClick={() => setOpen(x)} className="card group cursor-pointer p-4 transition hover:border-white/15">
              <Thumb d={x} />
              <div className="mt-4 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white">{x.title}</div>
                  <div className="truncate text-xs text-slate-500">{x.desc || 'Нет описания'}</div>
                </div>
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => upsert({ ...x, star: !x.star })} title="Избранное" className="rounded p-1 text-slate-500 hover:text-amber-400">
                    <Star className={cx('h-4 w-4', x.star && 'fill-amber-400 text-amber-400')} />
                  </button>
                  <div className="relative">
                    <button onClick={() => setMenu(menu === x.id ? null : x.id)} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"><MoreVertical className="h-4 w-4" /></button>
                    {menu === x.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />
                        <div className="absolute right-0 z-40 mt-1 w-44 rounded-xl border border-white/10 bg-ink-850 p-1 shadow-2xl">
                          <button onClick={() => { setOpen(x); setMenu(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"><Pencil className="h-4 w-4" /> Открыть</button>
                          <button onClick={() => { upsert({ ...x, id: 'd' + Date.now(), title: x.title + ' (копия)', author: 'Вы', views: 0, star: false, updated: new Date().toISOString() }); setMenu(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"><Copy className="h-4 w-4" /> Дублировать</button>
                          <button onClick={() => { setItems((xs) => xs.filter((y) => y.id !== x.id)); setMenu(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-white/5"><Trash2 className="h-4 w-4" /> Удалить</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-white/5 pt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {x.author}</span>
                <span>{x.widgets.length} {plural(x.widgets.length, 'виджет', 'виджета', 'виджетов')}</span>
                <span className="ml-auto">{fmtUpdated(x.updated)}</span>
                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {x.views}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
