import { useState } from 'react'
import { BookOpen, GitBranch, ShieldCheck, Search, Table2, Play, Plus, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge, Card, PageHeader, Stat, StatusDot, Table } from '../../components/ui'
import { BarChart } from '../../components/charts'

const tables = [
  { name: 'dwh.fact_orders', owner: 'data-team', rows: '184M', fresh: '12 мин', tags: ['PII', 'gold'], desc: 'Факт заказов, обновляется каждые 15 минут' },
  { name: 'dwh.dim_users', owner: 'data-team', rows: '12.4M', fresh: '1 ч', tags: ['PII'], desc: 'Справочник пользователей' },
  { name: 'raw.wm_events', owner: 'analytics', rows: '9.2B', fresh: 'live', tags: ['raw'], desc: 'Сырые события Wildmetrics' },
  { name: 'mart.revenue_daily', owner: 'finance', rows: '2.1K', fresh: '3 ч', tags: ['gold'], desc: 'Витрина ежедневной выручки' },
  { name: 'ml.features_churn', owner: 'ml-team', rows: '12.4M', fresh: '1 д', tags: ['feature-store'], desc: 'Признаки для модели оттока' },
]

export function DataCatalog() {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(tables[0])
  return (
    <>
      <PageHeader title="Каталог данных" subtitle="Единая точка поиска данных компании: описание, владельцы, свежесть и происхождение (lineage)." icon={BookOpen} />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input className="input pl-9" placeholder="Поиск таблиц, колонок, дашбордов…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="space-y-2">
            {tables.filter((t) => t.name.includes(q)).map((t) => (
              <button key={t.name} onClick={() => setSel(t)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${sel.name === t.name ? 'border-pink-400/40 bg-pink-500/5' : 'border-white/5 hover:border-white/15'}`}>
                <Table2 className="h-5 w-5 shrink-0 text-pink-300" />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm text-white">{t.name}</div>
                  <div className="truncate text-xs text-slate-500">{t.desc}</div>
                </div>
                <div className="hidden gap-1 sm:flex">{t.tags.map((g) => <Badge key={g} tone={g === 'PII' ? 'red' : g === 'gold' ? 'amber' : 'slate'}>{g}</Badge>)}</div>
              </button>
            ))}
          </div>
        </Card>
        <Card title={sel.name}>
          <div className="space-y-2 text-sm">
            {[['Владелец', sel.owner], ['Строк', sel.rows], ['Свежесть', sel.fresh]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="text-slate-200">{v}</span></div>
            ))}
          </div>
          <div className="mt-5 text-xs text-slate-500">Lineage</div>
          <div className="mt-3 flex flex-col items-stretch gap-2">
            {['raw.wm_events', 'stg.events_clean', sel.name, 'BI: Продажи'].map((n, i, a) => (
              <div key={n + i}>
                <div className={`rounded-lg border px-3 py-2 font-mono text-xs ${n === sel.name ? 'border-pink-400/50 bg-pink-500/10 text-white' : 'border-white/10 text-slate-400'}`}>{n}</div>
                {i < a.length - 1 && <ArrowRight className="mx-auto my-1 h-3 w-3 rotate-90 text-slate-600" />}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

export function Pipelines() {
  const [runs, setRuns] = useState<Record<string, boolean>>({})
  const pipes = [
    { name: 'wm_events → dwh', type: 'Streaming', sched: 'непрерывно', last: 'успешно', dur: '—', status: 'running' as const },
    { name: 'postgres_cdc', type: 'CDC', sched: 'непрерывно', last: 'успешно', dur: '—', status: 'running' as const },
    { name: 'mart_revenue_daily', type: 'dbt', sched: '0 */3 * * *', last: 'успешно', dur: '4 мин', status: 'stopped' as const },
    { name: 'ml_features_churn', type: 'Spark', sched: '0 2 * * *', last: 'ошибка', dur: '18 мин', status: 'error' as const },
  ]
  return (
    <>
      <PageHeader title="Пайплайны" subtitle="ETL/ELT, CDC и стриминг. Оркестрация по расписанию и событиям, dbt-модели и Spark-задачи." icon={GitBranch} actions={<button className="btn-primary"><Plus className="h-4 w-4" /> Пайплайн</button>} />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Пайплайны" value="24" />
        <Stat label="Успешных за сутки" value="98.6%" delta="+0.4%" />
        <Stat label="Данных обработано" value="3.4 TB" />
        <Stat label="Ошибки" value="1" delta="-2" />
      </div>
      <Card>
        <Table
          head={['Пайплайн', 'Тип', 'Расписание', 'Последний запуск', 'Длительность', 'Статус', '']}
          rows={pipes.map((p) => [
            <span className="font-mono text-white">{p.name}</span>,
            <Badge tone="violet">{p.type}</Badge>,
            <span className="font-mono text-xs">{p.sched}</span>,
            <span className={p.last === 'ошибка' ? 'text-rose-400' : 'text-emerald-400'}>{p.last}</span>,
            p.dur,
            runs[p.name] ? <StatusDot status="pending" /> : <StatusDot status={p.status} />,
            <button onClick={() => { setRuns((r) => ({ ...r, [p.name]: true })); setTimeout(() => setRuns((r) => ({ ...r, [p.name]: false })), 2000) }} className="btn-ghost px-2.5 py-1 text-xs"><Play className="h-3 w-3" /> Запуск</button>,
          ])}
        />
      </Card>
    </>
  )
}

export function DataQuality() {
  return (
    <>
      <PageHeader title="Качество данных" subtitle="Автоматические проверки: полнота, уникальность, свежесть, аномалии в распределениях." icon={ShieldCheck} actions={<button className="btn-primary"><Plus className="h-4 w-4" /> Проверка</button>} />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Проверок" value="312" />
        <Stat label="Пройдено" value="97.4%" delta="+1.1%" />
        <Stat label="Инциденты" value="3" delta="-4" />
        <Stat label="Покрытие таблиц" value="81%" delta="+6%" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Результаты за неделю">
          <BarChart color="#f472b6" data={['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((l, i) => ({ label: l, value: [96, 97, 95, 98, 97, 99, 97][i] }))} />
        </Card>
        <Card title="Инциденты">
          <div className="space-y-3">
            {[
              { t: 'dwh.fact_orders: дубликаты order_id', s: 'Открыт', ok: false },
              { t: 'ml.features_churn: устаревшие данные (> 24 ч)', s: 'Открыт', ok: false },
              { t: 'mart.revenue_daily: аномалия −38%', s: 'Расследуется', ok: false },
              { t: 'dim_users: NULL в email > 5%', s: 'Решён', ok: true },
            ].map((x) => (
              <div key={x.t} className="flex items-start gap-3 rounded-xl border border-white/5 bg-ink-850 p-3 text-sm">
                {x.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />}
                <span className="flex-1 font-mono text-xs text-slate-300">{x.t}</span>
                <Badge tone={x.ok ? 'green' : 'amber'}>{x.s}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
