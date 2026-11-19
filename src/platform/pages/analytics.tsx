import { useMemo, useState } from 'react'
import { Gauge, Plus, Copy, Check, FileBarChart, Users, Clock, MousePointerClick, Filter, FileJson, Smartphone, Download, Play, TrendingUp, Monitor, Globe, Apple } from 'lucide-react'
import { Badge, Card, Code, Modal, PageHeader, Stat, Table, Tabs, cx } from '../../components/ui'
import { BarChart, Donut, LineChart, days, fmt, series } from '../../components/charts'

/* ---------------- Counters ---------------- */

type Counter = { id: number; name: string; site: string; visits: number; created: string }

export function Counters() {
  const [counters, setCounters] = useState<Counter[]>([
    { id: 98213045, name: 'Основной сайт', site: 'shop.example.ru', visits: 48213, created: '02.09.2026' },
    { id: 98213112, name: 'Лендинг акции', site: 'promo.example.ru', visits: 3920, created: '28.10.2026' },
  ])
  const [sel, setSel] = useState(counters[0].id)
  const [modal, setModal] = useState(false)
  const [name, setName] = useState('')
  const [site, setSite] = useState('')
  const [copied, setCopied] = useState(false)
  const c = counters.find((x) => x.id === sel) ?? counters[0]
  const snippet = `<!-- Wildmetrics counter -->
<script>
  (function(w,d,s,id){w.wm=w.wm||function(){(w.wm.q=w.wm.q||[]).push(arguments)};
  var e=d.createElement(s);e.async=1;e.src='https://cdn.ai-studio.space/wm.js';
  d.head.appendChild(e);wm('init', id, {clickmap:true, webvisor:true});
  })(window, document, 'script', ${c.id});
</script>
<!-- /Wildmetrics counter -->`

  return (
    <>
      <PageHeader
        title="Wildmetrics"
        subtitle="Создайте счётчик, установите код на сайт — и через несколько минут увидите посетителей, клики и конверсии."
        icon={Gauge}
        actions={<button onClick={() => setModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> Новый счётчик</button>}
      />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {counters.map((x) => (
            <button key={x.id} onClick={() => setSel(x.id)} className={cx('card w-full p-4 text-left transition', sel === x.id ? 'border-orange-400/50' : 'hover:border-white/15')}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{x.name}</span>
                <span className={cx('h-2 w-2 rounded-full', x.visits ? 'bg-emerald-400' : 'bg-amber-400')} />
              </div>
              <div className="mt-1 text-xs text-slate-500">{x.site}</div>
              <div className="mt-3 flex justify-between text-xs">
                <span className="font-mono text-slate-400">#{x.id}</span>
                <span className="text-slate-300">{fmt(x.visits)} визитов</span>
              </div>
            </button>
          ))}
        </div>
        <div className="space-y-4">
          <Card title={`Код счётчика #${c.id}`} action={c.visits ? <Badge tone="green">Данные поступают</Badge> : <Badge tone="amber">Ожидает установки</Badge>}>
            <p className="mb-3 text-sm text-slate-400">Вставьте код в <code className="rounded bg-white/5 px-1">&lt;head&gt;</code> на всех страницах сайта <span className="text-slate-200">{c.site}</span>.</p>
            <div className="relative">
              <Code>{snippet}</Code>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(snippet).catch(() => {})
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
                className="btn-ghost absolute right-2 top-2 px-2.5 h-6 text-xs"
              >
                {copied ? <><Check className="h-3.5 w-3.5" /> Скопировано</> : <><Copy className="h-3.5 w-3.5" /> Копировать</>}
              </button>
            </div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              {['Карта кликов', 'Вебвизор', 'Электронная коммерция'].map((f) => (
                <label key={f} className="flex items-center gap-2 rounded-xl border border-white/5 bg-ink-850 px-3 py-2">
                  <input type="checkbox" defaultChecked className="accent-orange-500" /> {f}
                </label>
              ))}
            </div>
          </Card>
          <Card title="Посещаемость за 30 дней">
            <LineChart labels={days(30)} series={[{ name: 'Визиты', data: series(30, c.visits / 40 || 5, c.visits / 60 || 4, c.id % 7), color: '#fa8c16' }]} />
          </Card>
        </div>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Новый счётчик">
        <div className="space-y-4">
          <div><label className="label">Название</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Мой сайт" /></div>
          <div><label className="label">Адрес сайта</label><input className="input" value={site} onChange={(e) => setSite(e.target.value)} placeholder="example.ru" /></div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(false)} className="btn-ghost">Отмена</button>
            <button
              onClick={() => {
                const id = 98213000 + Math.floor(Math.random() * 999)
                setCounters((x) => [...x, { id, name: name || 'Новый счётчик', site: site || 'example.ru', visits: 0, created: new Date().toLocaleDateString('ru-RU') }])
                setSel(id)
                setModal(false)
                setName('')
                setSite('')
              }}
              className="btn-primary"
            >
              Создать и получить код
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/* ---------------- Reports ---------------- */

export function Reports() {
  const [tab, setTab] = useState<'traffic' | 'tech' | 'sources' | 'geo'>('traffic')
  const [period, setPeriod] = useState(30)
  return (
    <>
      <PageHeader
        title="Отчёты"
        subtitle="Готовые отчёты по посещаемости, технологиям, источникам трафика и географии."
        icon={FileBarChart}
        actions={
          <>
            <select className="input w-auto" value={period} onChange={(e) => setPeriod(+e.target.value)}>
              <option value={7}>7 дней</option>
              <option value={30}>30 дней</option>
              <option value={90}>90 дней</option>
            </select>
            <button className="btn-ghost"><Download className="h-4 w-4" /> Экспорт</button>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Визиты" value="1.24M" delta="+12.4%" icon={TrendingUp} />
        <Stat label="Посетители" value="486K" delta="+8.1%" icon={Users} />
        <Stat label="Отказы" value="31.2%" delta="-2.3%" icon={MousePointerClick} />
        <Stat label="Время на сайте" value="3:42" delta="+0:14" icon={Clock} />
      </div>
      <div className="mb-4"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'traffic', label: 'Посещаемость' }, { id: 'tech', label: 'Технологии' }, { id: 'sources', label: 'Источники' }, { id: 'geo', label: 'География' }]} /></div>
      {tab === 'traffic' && (
        <Card title="Визиты и посетители">
          <LineChart labels={days(period)} series={[{ name: 'Визиты', data: series(period, 32000, 16000, 2), color: '#fa8c16' }, { name: 'Посетители', data: series(period, 14000, 7000, 5), color: '#1677ff' }]} height={280} />
        </Card>
      )}
      {tab === 'tech' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Устройства"><Donut data={[{ label: 'Смартфоны', value: 62, color: '#fa8c16' }, { label: 'Десктоп', value: 31, color: '#1677ff' }, { label: 'Планшеты', value: 7, color: '#13c2c2' }]} /></Card>
          <Card title="Браузеры"><Donut data={[{ label: 'Chrome', value: 48, color: '#52c41a' }, { label: 'Safari', value: 27, color: '#2f54eb' }, { label: 'Яндекс', value: 16, color: '#ff4d4f' }, { label: 'Другие', value: 9, color: '#8c8c8c' }]} /></Card>
          <Card title="ОС"><Donut data={[{ label: 'Android', value: 41, color: '#52c41a' }, { label: 'iOS', value: 23, color: '#bfbfbf' }, { label: 'Windows', value: 26, color: '#2f54eb' }, { label: 'macOS', value: 10, color: '#1677ff' }]} /></Card>
          <Card title="Разрешения экрана" className="lg:col-span-3">
            <BarChart color="#fa8c16" data={[{ label: '390×844', value: 182 }, { label: '1920×1080', value: 151 }, { label: '412×915', value: 120 }, { label: '1536×864', value: 74 }, { label: '1440×900', value: 61 }, { label: '360×800', value: 55 }, { label: '2560×1440', value: 33 }]} />
          </Card>
        </div>
      )}
      {tab === 'sources' && (
        <Card title="Источники трафика">
          <Table
            head={['Источник', 'Визиты', 'Доля', 'Отказы', 'Конверсия']}
            rows={[
              ['Поисковые системы', '512 304', '41.3%', '24.1%', '3.8%'],
              ['Прямые заходы', '298 112', '24.0%', '28.7%', '4.2%'],
              ['Реклама', '204 551', '16.5%', '39.4%', '2.1%'],
              ['Социальные сети', '133 090', '10.7%', '44.2%', '1.4%'],
              ['Ссылки на сайтах', '92 870', '7.5%', '33.0%', '2.7%'],
            ].map((r) => r.map((c, i) => (i === 0 ? <span className="text-white">{c}</span> : c)))}
          />
        </Card>
      )}
      {tab === 'geo' && (
        <Card title="Города">
          <div className="space-y-3">
            {[['Москва', 38], ['Санкт-Петербург', 17], ['Новосибирск', 6], ['Екатеринбург', 5], ['Казань', 4], ['Краснодар', 4], ['Другие', 26]].map(([c, v]) => (
              <div key={c} className="flex items-center gap-4 text-sm">
                <Globe className="h-4 w-4 text-slate-500" />
                <span className="w-40 text-slate-300">{c}</span>
                <div className="h-2 flex-1 rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500" style={{ width: `${(+v / 38) * 100}%` }} /></div>
                <span className="w-12 text-right tabular-nums text-slate-400">{v}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}

/* ---------------- Heatmap ---------------- */

export function Heatmap() {
  const [page, setPage] = useState('/')
  const [mode, setMode] = useState<'clicks' | 'scroll'>('clicks')
  const spots = useMemo(() => {
    let s = page.length * 17 + 3
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
    const base = [
      [78, 7, 1], [50, 33, 1], [42, 46, 0.8], [58, 46, 0.6], [20, 72, 0.5], [50, 72, 0.7], [80, 72, 0.4], [50, 92, 0.3], [12, 7, 0.5],
    ]
    return [...base.map(([x, y, w]) => ({ x, y, w })), ...Array.from({ length: 30 }, () => ({ x: r() * 100, y: r() * 100, w: r() * 0.3 }))]
  }, [page])
  return (
    <>
      <PageHeader
        title="Карта кликов"
        subtitle="Тепловая карта показывает, куда кликают и докуда прокручивают страницу ваши посетители."
        icon={MousePointerClick}
        actions={
          <>
            <select className="input w-auto" value={page} onChange={(e) => setPage(e.target.value)}>
              {['/', '/catalog', '/product/42', '/cart', '/checkout'].map((p) => <option key={p}>{p}</option>)}
            </select>
            <Tabs value={mode} onChange={setMode} tabs={[{ id: 'clicks', label: 'Клики' }, { id: 'scroll', label: 'Скроллинг' }]} />
          </>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="card overflow-hidden p-3">
          <div className="theme-fixed relative mx-auto aspect-[4/5] max-w-3xl overflow-hidden rounded-xl bg-slate-100 sm:aspect-[16/12]">
            {/* fake page */}
            <div className="absolute inset-0 p-[4%] text-slate-400">
              <div className="flex items-center justify-between"><div className="h-4 w-24 rounded bg-slate-300" /><div className="flex gap-3"><div className="h-3 w-12 rounded bg-slate-300" /><div className="h-3 w-12 rounded bg-slate-300" /><div className="h-6 w-20 rounded-md bg-slate-400" /></div></div>
              <div className="mx-auto mt-[8%] h-6 w-2/3 rounded bg-slate-300" />
              <div className="mx-auto mt-3 h-3 w-1/2 rounded bg-slate-200" />
              <div className="mx-auto mt-[4%] flex w-fit gap-3"><div className="h-8 w-28 rounded-lg bg-slate-500" /><div className="h-8 w-28 rounded-lg bg-slate-300" /></div>
              <div className="mt-[10%] grid grid-cols-3 gap-[3%]">{[0, 1, 2].map((i) => <div key={i} className="aspect-[4/3] rounded-lg bg-slate-200" />)}</div>
              <div className="mx-auto mt-[6%] h-10 w-1/3 rounded-lg bg-slate-300" />
            </div>
            {mode === 'clicks' ? (
              <div className="absolute inset-0 mix-blend-multiply">
                {spots.map((p, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: `${6 + p.w * 14}%`,
                      aspectRatio: '1',
                      transform: 'translate(-50%,-50%)',
                      background: `radial-gradient(circle, rgba(255,77,79,${0.35 + p.w * 0.6}) 0%, rgba(250,173,20,${0.25 + p.w * 0.3}) 35%, rgba(22,119,255,0.15) 60%, transparent 72%)`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,77,79,.45) 0%, rgba(250,173,20,.4) 35%, rgba(82,196,26,.3) 60%, rgba(22,119,255,.3) 80%, rgba(30,41,59,.5) 100%)' }}>
                {[25, 50, 75].map((p) => (
                  <div key={p} className="absolute inset-x-0 border-t border-dashed border-slate-900/40" style={{ top: `${p}%` }}>
                    <span className="ml-2 rounded bg-slate-900/70 px-1.5 text-[10px] text-white">{100 - p * 0.9}% дочитали</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <Card title="Топ элементов">
            <div className="space-y-2.5 text-sm">
              {[['Кнопка «Купить»', 2841], ['Меню: Каталог', 1932], ['Баннер акции', 1204], ['Поиск', 988], ['Карточка товара #1', 760]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-slate-300">{k}</span><span className="tabular-nums text-slate-500">{v}</span></div>
              ))}
            </div>
          </Card>
          <Card title="Устройство">
            <div className="flex gap-2"><button className="btn-ghost flex-1 px-2 text-xs"><Monitor className="h-3.5 w-3.5" /> Десктоп</button><button className="btn-ghost flex-1 px-2 text-xs"><Smartphone className="h-3.5 w-3.5" /> Мобильные</button></div>
          </Card>
        </div>
      </div>
    </>
  )
}

/* ---------------- Funnels ---------------- */

export function Funnels() {
  const [steps, setSteps] = useState([
    { name: 'Главная', v: 100000 },
    { name: 'Каталог', v: 61200 },
    { name: 'Карточка товара', v: 38400 },
    { name: 'Корзина', v: 12900 },
    { name: 'Оформление', v: 7400 },
    { name: 'Оплата', v: 5100 },
  ])
  const [newStep, setNewStep] = useState('')
  return (
    <>
      <PageHeader title="Воронки" subtitle="Стройте воронки из событий и страниц, находите шаги с наибольшими потерями." icon={Filter} actions={<button className="btn-primary"><Plus className="h-4 w-4" /> Новая воронка</button>} />
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <Card title="Воронка покупки · 30 дней" action={<Badge tone="green">CR {((steps[steps.length - 1].v / steps[0].v) * 100).toFixed(1)}%</Badge>}>
          <div className="space-y-2">
            {steps.map((s, i) => {
              const pct = (s.v / steps[0].v) * 100
              const drop = i ? 100 - (s.v / steps[i - 1].v) * 100 : 0
              return (
                <div key={s.name}>
                  {i > 0 && <div className="py-1 pl-4 text-xs text-rose-400/80">↓ потеря {drop.toFixed(1)}%</div>}
                  <div className="flex items-center gap-4">
                    <div className="w-36 shrink-0 text-sm text-slate-300">{i + 1}. {s.name}</div>
                    <div className="relative h-10 flex-1 overflow-hidden rounded-lg bg-white/[0.03]">
                      <div className="h-full rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 transition-all" style={{ width: `${pct}%`, opacity: 1 - i * 0.1 }} />
                      <span className="absolute inset-y-0 left-3 flex items-center text-sm font-medium text-white">{s.v.toLocaleString('ru-RU')}</span>
                    </div>
                    <div className="w-14 text-right text-sm tabular-nums text-slate-400">{pct.toFixed(1)}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
        <Card title="Шаги воронки">
          <div className="space-y-2">
            {steps.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 rounded-xl border border-white/5 bg-ink-850 px-3 py-2 text-sm">
                <span className="grid h-5 w-5 place-items-center rounded bg-white/5 text-[10px]">{i + 1}</span>
                <span className="flex-1">{s.name}</span>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!newStep) return
              setSteps((x) => [...x, { name: newStep, v: Math.round(x[x.length - 1].v * 0.7) }])
              setNewStep('')
            }}
            className="mt-3 flex gap-2"
          >
            <input className="input" placeholder="Событие или URL" value={newStep} onChange={(e) => setNewStep(e.target.value)} />
            <button className="btn-ghost px-3"><Plus className="h-4 w-4" /></button>
          </form>
        </Card>
      </div>
    </>
  )
}

/* ---------------- Raw data ---------------- */

export function RawData() {
  const [rows, setRows] = useState<null | string[][]>(null)
  const [sql, setSql] = useState(`SELECT event_time, client_id, event_name, url, device\nFROM wm.events\nWHERE counter_id = 98213045\n  AND event_date = today()\nORDER BY event_time DESC\nLIMIT 100`)
  return (
    <>
      <PageHeader title="RawData" subtitle="Доступ к сырым событиям: SQL-интерфейс, Logs API, выгрузка в S3 и ClickHouse." icon={FileJson} actions={<button className="btn-ghost"><Download className="h-4 w-4" /> Logs API</button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Запрос" className="lg:col-span-2">
          <textarea className="input h-40 resize-none font-mono text-xs" value={sql} onChange={(e) => setSql(e.target.value)} />
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() =>
                setRows(
                  Array.from({ length: 8 }, (_, i) => [
                    `2026-11-18 18:${String(59 - i).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
                    String(1700000000 + i * 7919),
                    ['pageview', 'click', 'add_to_cart', 'purchase'][i % 4],
                    ['/', '/catalog', '/product/42', '/cart'][i % 4],
                    ['mobile', 'desktop'][i % 2],
                  ]),
                )
              }
              className="btn-primary"
            >
              <Play className="h-4 w-4" /> Выполнить
            </button>
            <span className="text-xs text-slate-500">ClickHouse · wm.events</span>
          </div>
        </Card>
        <Card title="Экспорт">
          <div className="space-y-2">
            {['Выгрузка в S3 (Parquet)', 'Репликация в ClickHouse', 'Стриминг в Kafka', 'Скачать CSV'].map((x) => (
              <button key={x} className="btn-ghost w-full justify-start">{x}</button>
            ))}
          </div>
        </Card>
      </div>
      {rows && (
        <Card title={`Результат · ${rows.length} строк · 0.042 с`} className="mt-4">
          <Table head={['event_time', 'client_id', 'event_name', 'url', 'device']} rows={rows.map((r) => r.map((c) => <span className="font-mono text-xs">{c}</span>))} />
        </Card>
      )}
    </>
  )
}

/* ---------------- App tracker ---------------- */

export function AppTracker() {
  return (
    <>
      <PageHeader title="App Tracker" subtitle="Атрибуция установок мобильных приложений, трекинговые ссылки и постбэки рекламным сетям." icon={Smartphone} actions={<button className="btn-primary"><Plus className="h-4 w-4" /> Приложение</button>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Установки" value="38 412" delta="+16%" />
        <Stat label="Органика" value="61%" delta="+3%" />
        <Stat label="CPI" value="74 ₽" delta="-8%" />
        <Stat label="Retention D1" value="42%" delta="+1.5%" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Установки по дням" className="lg:col-span-2">
          <LineChart labels={days(30)} series={[{ name: 'iOS', data: series(30, 500, 300, 8), color: '#bfbfbf' }, { name: 'Android', data: series(30, 800, 400, 9), color: '#52c41a' }]} />
        </Card>
        <Card title="Приложения">
          <div className="space-y-3">
            {[{ n: 'Shop iOS', i: Apple, v: '14 902' }, { n: 'Shop Android', i: Smartphone, v: '23 510' }].map((a) => (
              <div key={a.n} className="flex items-center gap-3 rounded-xl border border-white/5 bg-ink-850 p-3">
                <a.i className="h-5 w-5 text-slate-300" />
                <span className="flex-1 text-sm text-white">{a.n}</span>
                <span className="text-sm tabular-nums text-slate-400">{a.v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Источники установок" className="mt-4">
        <Table
          head={['Источник', 'Клики', 'Установки', 'CR', 'CPI', 'Retention D7']}
          rows={[
            ['Органика', '—', '23 431', '—', '—', '24%'],
            ['VK Реклама', '182 400', '7 812', '4.3%', '68 ₽', '18%'],
            ['Яндекс Директ', '96 210', '4 920', '5.1%', '81 ₽', '21%'],
            ['Telegram Ads', '61 900', '2 249', '3.6%', '92 ₽', '15%'],
          ]}
        />
      </Card>
    </>
  )
}
