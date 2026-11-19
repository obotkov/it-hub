import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, ChevronDown, ChevronsUpDown, ArrowUp, ArrowDown, Filter as FilterIcon, MoreVertical, Settings, Smartphone, Apple, Globe,
  ArrowLeft, Copy, Square, Trash2, Check, X, Split, Users, Calendar, Target,
} from 'lucide-react'
import { Badge, Card, Modal, Table, cx } from '../../components/ui'
import type { Tone } from '../../components/ui'
import { LineChart, days } from '../../components/charts'

/* ------------------------------ data ------------------------------ */

type Status = 'draft' | 'planned' | 'active' | 'done'
type Platform = 'android' | 'ios' | 'web'
type App = { id: string; name: string; color: string }

const apps: App[] = [
  { id: 'shop', name: 'Shop', color: '#a855f7' },
  { id: 'travel', name: 'Shop Travel', color: '#f97316' },
  { id: 'pay', name: 'Shop Pay', color: '#22c55e' },
  { id: 'seller', name: 'Seller', color: '#3b82f6' },
]

const layers = [
  { name: 'Поиск: ранжирование', unit: 'User ID' },
  { name: 'Поиск UI', unit: 'User ID' },
  { name: 'Каталог', unit: 'Device ID' },
  { name: 'Корзина и чекаут', unit: 'User ID' },
  { name: 'Финтех: кошелёк', unit: 'User ID' },
  { name: 'Travel: отели', unit: 'Session ID' },
  { name: 'Performance', unit: 'Device ID' },
  { name: 'Рекомендации', unit: 'User ID' },
]

const titles = [
  'Ранжирование. Буст новых товаров v3',
  'Поисковые теги для мультизапросов',
  'Travel | Web | Ранжирование подсказок',
  'iOS + Android | Подтверждение перевода в один шаг',
  'Site. Lazy load изображений (performance)',
  'Новая карточка товара с видео',
  'Бесплатная доставка от 2000 ₽',
  'Онбординг продавца в 3 шага',
  'Кнопка «Купить в 1 клик» в каталоге',
  'Персональные подборки на главной',
  'Упрощённая форма оплаты',
  'Push-напоминание о брошенной корзине',
  'Тёмная тема по умолчанию',
  'Фильтр «Рядом со мной» в Travel',
  'Кешбэк баллами при оплате кошельком',
  'Сортировка отзывов по полезности',
  'Новый алгоритм похожих товаров',
  'Баннер рассрочки на карточке',
  'Сжатие JS-бандла на мобильном вебе',
  'Голосовой поиск в приложении',
  'Блок «С этим покупают» в корзине',
  'Лимит избранного: 500 → 1000',
  'Автоподстановка адреса доставки',
  'Цены со скидкой крупнее в выдаче',
]

const people = ['Вы', 'Анна Смирнова', 'Илья Петров', 'Мария Кузнецова', 'Дмитрий Орлов', 'Елена Волкова', 'Сергей Морозов']
const metricsPool = ['CR в заказ', 'Выручка на пользователя', 'Средний чек', 'CTR выдачи', 'Retention D7', 'Время загрузки (LCP)', 'Добавления в корзину']

type Exp = {
  id: number
  title: string
  app: App
  platforms: Platform[]
  layer: (typeof layers)[number]
  traffic: number
  status: Status
  start: string
  end: string
  hour: number
  author: string
  metric: string
  lift: number
  p: number
}

const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`

function makeExperiments(): Exp[] {
  let s = 7
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  const statuses: Status[] = ['active', 'active', 'active', 'done', 'done', 'draft', 'active', 'planned', 'done', 'active']
  const platformSets: Platform[][] = [['android', 'ios', 'web'], ['android', 'ios'], ['web'], ['android', 'ios', 'web'], ['ios'], ['web'], ['android']]
  const today = new Date(2026, 10, 18)
  return titles.map((title, i) => {
    const status = statuses[i % statuses.length]
    const offset = status === 'done' ? -30 - Math.round(r() * 40) : status === 'planned' ? 3 + Math.round(r() * 10) : status === 'draft' ? 0 : -Math.round(r() * 12)
    const start = new Date(today.getTime() + offset * 864e5)
    const end = new Date(start.getTime() + (14 + Math.round(r() * 14)) * 864e5)
    const app = title.includes('Travel') ? apps[1] : title.includes('Финтех') || title.includes('кошельк') || title.includes('перевода') ? apps[2] : title.includes('продавца') ? apps[3] : apps[i % 5 === 4 ? 3 : 0]
    return {
      id: 8692 - i * 2 - (i > 5 ? 1 : 0),
      title,
      app,
      platforms: title.startsWith('Site') || title.includes('Web') || title.includes('веб') ? ['web'] : platformSets[i % platformSets.length],
      layer: layers[i % layers.length],
      traffic: [9, 45, 92, 60, 40, 50, 20, 10, 100, 30][i % 10],
      status,
      start: fmtDate(start),
      end: fmtDate(end),
      hour: 10 + (i * 3) % 10,
      author: people[i % people.length],
      metric: metricsPool[i % metricsPool.length],
      lift: +((r() - 0.3) * 9).toFixed(1),
      p: +(r() * (i % 3 === 0 ? 0.04 : 0.4)).toFixed(3),
    }
  })
}

const statusMeta: Record<Status, { label: string; tone: Tone }> = {
  active: { label: 'Активен', tone: 'green' },
  planned: { label: 'Запланирован', tone: 'amber' },
  draft: { label: 'Черновик', tone: 'slate' },
  done: { label: 'Завершён', tone: 'violet' },
}

const platformIcon = { android: Smartphone, ios: Apple, web: Globe }
const platformName = { android: 'Android', ios: 'iOS', web: 'Web' }

/* ------------------------------ small pieces ------------------------------ */

function AppChip({ app }: { app: App }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs text-slate-200">
      <span className="h-3.5 w-3.5 rounded-full" style={{ background: app.color }} />
      {app.name}
    </span>
  )
}

function Dropdown({ label, value, options, onChange, multi }: { label: string; value: string[]; options: { id: string; name: string; color?: string }[]; onChange: (v: string[]) => void; multi?: boolean }) {
  const [open, setOpen] = useState(false)
  const picked = options.filter((o) => value.includes(o.id))
  return (
    <div className="relative min-w-0 flex-1">
      <button onClick={() => setOpen(!open)} className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm hover:bg-white/[0.03]">
        {picked.length === 0 ? (
          <span className="flex-1 truncate text-slate-500">{label}</span>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 truncate rounded-lg bg-white/[0.06] px-2 py-0.5 text-xs text-slate-200">
              {picked[0].color && <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: picked[0].color }} />}
              <span className="truncate">{picked[0].name}</span>
              <X className="h-3 w-3 shrink-0 cursor-pointer text-slate-500 hover:text-white" onClick={(e) => { e.stopPropagation(); onChange(value.filter((v) => v !== picked[0].id)) }} />
            </span>
            {picked.length > 1 && <span className="rounded-lg bg-white/[0.06] px-2 py-0.5 text-xs text-slate-300">+{picked.length - 1}</span>}
          </span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-40 mt-1 w-64 animate-fadeup rounded-2xl border border-white/10 bg-ink-850 p-1.5 shadow-2xl">
            {options.map((o) => {
              const on = value.includes(o.id)
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    onChange(multi ? (on ? value.filter((v) => v !== o.id) : [...value, o.id]) : on ? [] : [o.id])
                    if (!multi) setOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <span className={cx('grid h-4 w-4 place-items-center rounded border', on ? 'border-violet-500 bg-violet-500' : 'border-white/20')}>{on && <Check className="on-accent h-3 w-3 text-white" />}</span>
                  {o.color && <span className="h-3 w-3 rounded-full" style={{ background: o.color }} />}
                  <span className="truncate">{o.name}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------ page ------------------------------ */

type Tab = 'mine' | Status
type SortKey = 'id' | 'title' | 'traffic' | 'start'

export function AbPlatform() {
  const [exps, setExps] = useState<Exp[]>(makeExperiments)
  const [tab, setTab] = useState<Tab>('active')
  const [q, setQ] = useState('')
  const [appF, setAppF] = useState<string[]>([])
  const [layerF, setLayerF] = useState<string[]>([])
  const [platF, setPlatF] = useState<string[]>([])
  const [authorF, setAuthorF] = useState<string[]>([])
  const [more, setMore] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'id', dir: -1 })
  const [menu, setMenu] = useState<number | null>(null)
  const [open, setOpen] = useState<Exp | null>(null)
  const [modal, setModal] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 10

  const counts = useMemo(
    () => ({
      mine: exps.filter((e) => e.author === 'Вы').length,
      draft: exps.filter((e) => e.status === 'draft').length,
      planned: exps.filter((e) => e.status === 'planned').length,
      active: exps.filter((e) => e.status === 'active').length,
      done: exps.filter((e) => e.status === 'done').length,
    }),
    [exps],
  )

  const list = useMemo(() => {
    const parse = (d: string) => d.split('.').reverse().join('')
    return exps
      .filter((e) => (tab === 'mine' ? e.author === 'Вы' : e.status === tab))
      .filter((e) => !q || `${e.title} ${e.id} ${e.author}`.toLowerCase().includes(q.toLowerCase()))
      .filter((e) => !appF.length || appF.includes(e.app.id))
      .filter((e) => !layerF.length || layerF.includes(e.layer.name))
      .filter((e) => !platF.length || e.platforms.some((p) => platF.includes(p)))
      .filter((e) => !authorF.length || authorF.includes(e.author))
      .sort((a, b) => {
        const k = sort.key
        const va = k === 'start' ? parse(a.start) : a[k]
        const vb = k === 'start' ? parse(b.start) : b[k]
        const c = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
        return c * sort.dir
      })
  }, [exps, tab, q, appF, layerF, platF, authorF, sort])

  const pages = Math.max(1, Math.ceil(list.length / perPage))
  const shown = list.slice((page - 1) * perPage, page * perPage)
  const reset = () => {
    setQ('')
    setAppF([])
    setLayerF([])
    setPlatF([])
    setAuthorF([])
    setPage(1)
  }

  if (open) return <ExperimentView exp={open} onBack={() => setOpen(null)} />

  const tabs: { id: Tab; label: string }[] = [
    { id: 'mine', label: 'Мои' },
    { id: 'draft', label: 'Черновики' },
    { id: 'planned', label: 'Предстоящие' },
    { id: 'active', label: 'Активные' },
    { id: 'done', label: 'Завершённые' },
  ]

  const SortHead = ({ k, children, className }: { k: SortKey; children: string; className?: string }) => (
    <button onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? (s.dir === 1 ? -1 : 1) : 1 }))} className={cx('inline-flex items-center gap-1.5 hover:text-white', className)}>
      {children}
      {sort.key === k ? sort.dir === 1 ? <ArrowUp className="h-3.5 w-3.5 text-violet-400" /> : <ArrowDown className="h-3.5 w-3.5 text-violet-400" /> : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-600" />}
    </button>
  )

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-orange-500/20 to-rose-500/10"><Split className="h-5 w-5 text-orange-300" /></div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Эксперименты</h1>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> Новый эксперимент</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setPage(1) }}
            className={cx('rounded-xl border px-3.5 py-2 text-sm transition', tab === t.id ? 'border-violet-500/60 bg-violet-500/10 text-violet-200' : 'border-transparent bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]')}
          >
            {t.label} <span className="ml-1 text-slate-500">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {/* filters */}
        <div className="flex flex-col divide-y divide-white/[0.05] border-b border-white/[0.06] lg:flex-row lg:items-center lg:divide-x lg:divide-y-0">
          <div className="relative flex-[1.4] px-2 py-1.5">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input className="h-10 w-full bg-transparent pl-9 pr-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Поиск по названию, ID, создателю" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
          </div>
          <div className="flex flex-1 px-2 py-1.5"><Dropdown label="Приложение" multi value={appF} options={apps} onChange={(v) => { setAppF(v); setPage(1) }} /></div>
          <div className="flex flex-1 px-2 py-1.5"><Dropdown label="Команда и слой" multi value={layerF} options={layers.map((l) => ({ id: l.name, name: l.name }))} onChange={(v) => { setLayerF(v); setPage(1) }} /></div>
          <div className="flex flex-1 px-2 py-1.5"><Dropdown label="Платформа" multi value={platF} options={(['android', 'ios', 'web'] as Platform[]).map((p) => ({ id: p, name: platformName[p] }))} onChange={(v) => { setPlatF(v); setPage(1) }} /></div>
          <div className="flex shrink-0 gap-2 px-3 py-2">
            <button onClick={() => setMore(!more)} className={cx('btn-ghost px-3', more && 'border-violet-500/40 text-violet-200')}><FilterIcon className="h-4 w-4" /> Ещё</button>
            <button onClick={reset} className="btn-ghost px-3">Сбросить</button>
          </div>
        </div>
        {more && (
          <div className="flex flex-col gap-2 border-b border-white/[0.06] px-2 py-1.5 lg:flex-row">
            <div className="flex flex-1"><Dropdown label="Создатель" multi value={authorF} options={people.map((p) => ({ id: p, name: p }))} onChange={(v) => { setAuthorF(v); setPage(1) }} /></div>
            <div className="flex-[3]" />
          </div>
        )}

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[13px] font-medium text-slate-300">
                <th className="px-3 py-3 font-medium"><SortHead k="id">ID</SortHead></th>
                <th className="min-w-[210px] px-3 py-3 font-medium"><SortHead k="title">Название и приложение</SortHead></th>
                <th className="px-3 py-3 font-medium">Платформа</th>
                <th className="px-3 py-3 font-medium">Слой</th>
                <th className="px-3 py-3 font-medium"><SortHead k="traffic">Трафик</SortHead></th>
                <th className="px-3 py-3 font-medium">Статус</th>
                <th className="px-3 py-3 font-medium"><SortHead k="start">Дата начала</SortHead></th>
                <th className="px-3 py-3 font-medium">Создал</th>
                <th className="w-20 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <tr key={e.id} className="group border-b border-white/[0.04] transition hover:bg-white/[0.02]">
                  <td className="px-3 py-4 tabular-nums text-slate-300">{e.id}</td>
                  <td className="min-w-[210px] max-w-[340px] px-3 py-4">
                    <button onClick={() => setOpen(e)} className="text-left text-violet-300 hover:text-violet-200 hover:underline">{e.title}</button>
                    <div className="mt-1.5"><AppChip app={e.app} /></div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex gap-2 text-slate-400">
                      {e.platforms.map((p) => {
                        const I = platformIcon[p]
                        return <span key={p} title={platformName[p]}><I className="h-4 w-4" /></span>
                      })}
                    </div>
                  </td>
                  <td className="max-w-[150px] px-3 py-4">
                    <div className="truncate text-slate-200">{e.layer.name}</div>
                    <div className="text-xs text-slate-500">{e.layer.unit}</div>
                  </td>
                  <td className="px-3 py-4 tabular-nums text-slate-200">{e.traffic}%</td>
                  <td className="px-3 py-4"><Badge tone={statusMeta[e.status].tone}>{statusMeta[e.status].label}</Badge></td>
                  <td className="whitespace-nowrap px-3 py-4 tabular-nums text-slate-300">
                    {e.status === 'draft' ? (
                      <span className="text-slate-500">не задана</span>
                    ) : (
                      <>
                        <div>{e.start} – {e.end}</div>
                        <div className="text-slate-500">{e.hour}:00 – {e.hour}:00</div>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-4 text-slate-300">{e.author}</td>
                  <td className="px-3 py-4">
                    <div className="relative flex items-center justify-end gap-1">
                      <button onClick={() => setMenu(menu === e.id ? null : e.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><MoreVertical className="h-4 w-4" /></button>
                      <button onClick={() => setOpen(e)} title="Настройки" className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><Settings className="h-4 w-4" /></button>
                      {menu === e.id && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />
                          <div className="absolute right-10 top-8 z-40 w-48 animate-fadeup rounded-xl border border-white/10 bg-ink-850 p-1 shadow-2xl">
                            <button onClick={() => { setOpen(e); setMenu(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"><Target className="h-4 w-4" /> Результаты</button>
                            <button onClick={() => { setExps((x) => [{ ...e, id: Math.max(...x.map((y) => y.id)) + 1, title: e.title + ' (копия)', status: 'draft', author: 'Вы' }, ...x]); setMenu(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"><Copy className="h-4 w-4" /> Дублировать</button>
                            {e.status === 'active' && (
                              <button onClick={() => { setExps((x) => x.map((y) => (y.id === e.id ? { ...y, status: 'done' } : y))); setMenu(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"><Square className="h-4 w-4" /> Остановить</button>
                            )}
                            <button onClick={() => { setExps((x) => x.filter((y) => y.id !== e.id)); setMenu(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-white/5"><Trash2 className="h-4 w-4" /> Удалить</button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-16 text-center text-sm text-slate-500">Ничего не найдено. Измените фильтры или <button onClick={reset} className="text-violet-300 hover:underline">сбросьте их</button>.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-slate-400">
          <span>{list.length ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, list.length)} из ${list.length}` : '0 из 0'}</span>
          <div className="flex gap-1">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className={cx('h-8 min-w-8 rounded-lg px-2', page === n ? 'bg-white/10 text-white' : 'hover:bg-white/5')}>{n}</button>
            ))}
          </div>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Новый эксперимент">
        <NewExperiment
          onCancel={() => setModal(false)}
          onCreate={(e) => {
            setExps((x) => [{ ...e, id: Math.max(...x.map((y) => y.id)) + 1 }, ...x])
            setTab('draft')
            setPage(1)
            setModal(false)
          }}
        />
      </Modal>
    </>
  )
}

function NewExperiment({ onCancel, onCreate }: { onCancel: () => void; onCreate: (e: Exp) => void }) {
  const [title, setTitle] = useState('')
  const [app, setApp] = useState(apps[0].id)
  const [layer, setLayer] = useState(layers[0].name)
  const [traffic, setTraffic] = useState(50)
  const [metric, setMetric] = useState(metricsPool[0])
  const [plats, setPlats] = useState<Platform[]>(['android', 'ios', 'web'])
  return (
    <div className="space-y-4">
      <div><label className="label">Название</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Гипотеза: …" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Приложение</label><select className="input" value={app} onChange={(e) => setApp(e.target.value)}>{apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        <div><label className="label">Слой</label><select className="input" value={layer} onChange={(e) => setLayer(e.target.value)}>{layers.map((l) => <option key={l.name}>{l.name}</option>)}</select></div>
      </div>
      <div>
        <label className="label">Платформы</label>
        <div className="flex gap-2">
          {(['android', 'ios', 'web'] as Platform[]).map((p) => {
            const I = platformIcon[p]
            const on = plats.includes(p)
            return (
              <button key={p} type="button" onClick={() => setPlats((x) => (on ? x.filter((y) => y !== p) : [...x, p]))} className={cx('flex flex-1 items-center justify-center gap-2 rounded-xl border py-2 text-sm', on ? 'border-violet-500/50 bg-violet-500/10 text-violet-200' : 'border-white/10 text-slate-400')}>
                <I className="h-4 w-4" /> {platformName[p]}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex justify-between"><span className="label mb-0">Трафик в эксперименте</span><span className="font-mono text-xs text-slate-300">{traffic}%</span></div>
        <input type="range" min={1} max={100} value={traffic} onChange={(e) => setTraffic(+e.target.value)} className="w-full accent-violet-500" />
      </div>
      <div><label className="label">Ключевая метрика</label><select className="input" value={metric} onChange={(e) => setMetric(e.target.value)}>{metricsPool.map((m) => <option key={m}>{m}</option>)}</select></div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn-ghost">Отмена</button>
        <button
          onClick={() =>
            onCreate({
              id: 0, title: title || 'Новый эксперимент', app: apps.find((a) => a.id === app)!, platforms: plats.length ? plats : ['web'], layer: layers.find((l) => l.name === layer)!,
              traffic, status: 'draft', start: '—', end: '—', hour: 12, author: 'Вы', metric, lift: 0, p: 1,
            })
          }
          className="btn-primary"
        >
          Создать черновик
        </button>
      </div>
    </div>
  )
}

/* ------------------------------ experiment view ------------------------------ */

function ExperimentView({ exp, onBack }: { exp: Exp; onBack: () => void }) {
  useEffect(() => {
    document.querySelector('main')?.scrollTo(0, 0)
  }, [])
  const n = 9
  const base = 3.1
  const a = Array.from({ length: n }, (_, i) => +(base + Math.sin(i) * 0.06).toFixed(2))
  const b = a.map((v, i) => +(v * (1 + exp.lift / 100) + Math.cos(i) * 0.04).toFixed(2))
  const sig = exp.p < 0.05
  const rows = [exp.metric, ...metricsPool.filter((m) => m !== exp.metric).slice(0, 4)].map((m, i) => {
    const lift = i === 0 ? exp.lift : +((Math.sin(exp.id + i) * 3).toFixed(1))
    const p = i === 0 ? exp.p : +Math.abs(Math.cos(exp.id * i) * 0.5).toFixed(3)
    return { m, lift, p, key: i === 0 }
  })
  return (
    <>
      <button onClick={onBack} className="btn-ghost mb-5 px-3"><ArrowLeft className="h-4 w-4" /> Все эксперименты</button>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="tabular-nums">#{exp.id}</span>
            <AppChip app={exp.app} />
            <Badge tone={statusMeta[exp.status].tone}>{statusMeta[exp.status].label}</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{exp.title}</h1>
        </div>
        {exp.status !== 'draft' && <Badge tone={sig ? 'green' : 'amber'}>{sig ? `Значимо · p = ${exp.p}` : `Не значимо · p = ${exp.p}`}</Badge>}
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Info icon={Split} k="Слой" v={exp.layer.name} sub={exp.layer.unit} />
        <Info icon={Users} k="Трафик" v={`${exp.traffic}%`} sub="50 / 50 между группами" />
        <Info icon={Calendar} k="Период" v={exp.status === 'draft' ? 'не задан' : `${exp.start} – ${exp.end}`} sub={`создал: ${exp.author}`} />
        <Info icon={Target} k="Ключевая метрика" v={exp.metric} sub={exp.platforms.map((p) => platformName[p]).join(' · ')} />
      </div>
      {exp.status === 'draft' ? (
        <Card><div className="py-10 text-center text-sm text-slate-400">Эксперимент ещё не запущен — результаты появятся после старта.</div></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title={`${exp.metric} по дням`} className="lg:col-span-2">
            <LineChart labels={days(n)} series={[{ name: 'Контроль (A)', data: a, color: '#64748b' }, { name: 'Тест (B)', data: b, color: '#fb923c' }]} />
          </Card>
          <Card title="Метрики">
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.m} className={cx('flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm', r.key ? 'border-orange-400/30 bg-orange-500/[0.06]' : 'border-white/5 bg-ink-850')}>
                  <span className="text-slate-300">{r.m}</span>
                  <span className="flex items-center gap-2">
                    <span className={cx('tabular-nums', r.p < 0.05 ? (r.lift >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500')}>{r.lift > 0 ? '+' : ''}{r.lift}%</span>
                    <span className="w-14 text-right text-xs tabular-nums text-slate-500">p {r.p}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Группы" className="lg:col-span-3">
            <Table
              head={['Группа', 'Пользователи', exp.metric, 'Разница', 'Доверительный интервал']}
              rows={[
                ['A · контроль', (exp.traffic * 4210).toLocaleString('ru-RU'), a[n - 1], '—', '—'],
                ['B · тест', (exp.traffic * 4187).toLocaleString('ru-RU'), b[n - 1], <span className={exp.lift >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{exp.lift > 0 ? '+' : ''}{exp.lift}%</span>, `[${(exp.lift - 1.8).toFixed(1)}%; ${(exp.lift + 1.8).toFixed(1)}%]`],
              ]}
            />
          </Card>
        </div>
      )}
    </>
  )
}

function Info({ icon: Icon, k, v, sub }: { icon: typeof Split; k: string; v: string; sub: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500"><Icon className="h-3.5 w-3.5" /> {k}</div>
      <div className="mt-1.5 truncate font-medium text-white">{v}</div>
      <div className="truncate text-xs text-slate-500">{sub}</div>
    </div>
  )
}
