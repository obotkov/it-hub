import { ReactNode, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Copy, Diamond, GitFork, Grid3x3, Layers, Plus, RefreshCw, Search, Upload } from 'lucide-react'
import { Card, Modal, cx } from '../../components/ui'
import { series } from '../../components/charts'

type Env = 'Production' | 'Development'
type Health = 'Healthy' | 'Degraded' | 'Down'
type Service = {
  id: string
  name: string
  file: string
  team: string
  teamSlug: string
  backend: string
  env: Env
  status: Health
  rps: number
  p99: number
  rev: number
  history?: { rev: number; file: string; at: string }[]
}

const TEAMS = [
  { name: 'ML Platform', slug: 'ml-platform' },
  { name: 'Рекомендации', slug: 'recommendations' },
  { name: 'Risk Models', slug: 'risk-models' },
  { name: 'Search & Ranking', slug: 'search' },
]
const BACKENDS = ['mircurius-online-inference', 'NVIDIA Triton', 'vLLM', 'TorchServe']

const DEMO: Service[] = [
  { id: 's1', name: 'fraud-scoring', file: 'fraud_scoring.cbm', team: 'ML Platform', teamSlug: 'ml-platform', backend: 'mircurius-online-inference', env: 'Production', status: 'Healthy', rps: 2480, p99: 17, rev: 12 },
  { id: 's2', name: 'product-classifier', file: 'classifier.onnx', team: 'ML Platform', teamSlug: 'ml-platform', backend: 'NVIDIA Triton', env: 'Production', status: 'Healthy', rps: 8120, p99: 24, rev: 8 },
  { id: 's3', name: 'risk-ensemble', file: 'risk_ensemble.zip', team: 'ML Platform', teamSlug: 'ml-platform', backend: 'NVIDIA Triton', env: 'Development', status: 'Healthy', rps: 920, p99: 35, rev: 3 },
  { id: 's4', name: 'ranking-v2', file: 'ranking_model.cbm', team: 'Рекомендации', teamSlug: 'recommendations', backend: 'mircurius-online-inference', env: 'Production', status: 'Healthy', rps: 14300, p99: 11, rev: 21 },
  { id: 's5', name: 'fraud-experimental', file: 'risk_v4.onnx', team: 'Risk Models', teamSlug: 'risk-models', backend: 'NVIDIA Triton', env: 'Development', status: 'Degraded', rps: 530, p99: 82, rev: 4 },
  { id: 's6', name: 'search-quality', file: 'search_quality.onnx', team: 'Search & Ranking', teamSlug: 'search', backend: 'NVIDIA Triton', env: 'Production', status: 'Healthy', rps: 4880, p99: 28, rev: 7 },
]

const KEY = 'hub.services'
function load(): Service[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return DEMO
}

const fmtN = (n: number) => n.toLocaleString('ru-RU')
const ext = (f: string) => f.split('.').pop()?.toLowerCase() ?? ''
const FORMATS = [
  { id: 'cbm', name: 'CatBoost (.cbm)' },
  { id: 'onnx', name: 'ONNX (.onnx)' },
  { id: 'zip', name: 'Ансамбль (.zip)' },
]

function FormatIcon({ file }: { file: string }) {
  const e = ext(file)
  const [Icon, cls] = e === 'cbm' ? [Diamond, 'bg-emerald-500/10 text-emerald-400'] : e === 'zip' ? [GitFork, 'bg-blue-500/10 text-blue-400'] : [Grid3x3, 'bg-violet-500/10 text-violet-400']
  return (
    <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', cls)}>
      <Icon className="h-4 w-4" />
    </span>
  )
}

function EnvBadge({ env }: { env: Env }) {
  return (
    <span className={cx('inline-flex rounded-lg px-2.5 py-1 text-xs font-medium', env === 'Production' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/[0.06] text-slate-400')}>
      {env}
    </span>
  )
}

function HealthDot({ s }: { s: Health }) {
  const c = s === 'Healthy' ? 'bg-emerald-400' : s === 'Degraded' ? 'bg-amber-400' : 'bg-rose-500'
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-white">
      <span className={cx('h-2 w-2 rounded-full', c)} />
      {s}
    </span>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; name: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input w-auto min-w-[150px] cursor-pointer pr-8">
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  )
}

function SummaryCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-medium text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{value}</div>
      <div className="mt-3 text-xs text-slate-500">{hint}</div>
    </div>
  )
}

function ServicesList({ services, onOpen, onCreate }: { services: Service[]; onOpen: (s: Service) => void; onCreate: () => void }) {
  const [q, setQ] = useState('')
  const [team, setTeam] = useState('all')
  const [status, setStatus] = useState('all')
  const [format, setFormat] = useState('all')

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return services.filter(
      (x) =>
        (!s || [x.name, x.file, x.backend].some((v) => v.toLowerCase().includes(s))) &&
        (team === 'all' || x.team === team) &&
        (status === 'all' || x.status === status) &&
        (format === 'all' || ext(x.file) === format),
    )
  }, [services, q, team, status, format])

  const teams = new Set(services.map((s) => s.team)).size

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-400">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> Inference services
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Все inference-сервисы</h1>
          <p className="mt-2 text-sm text-slate-400">Развёрнутые модели и ансамбли, статусы, производительность и история.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-400">Демо-данные</span>
          <button onClick={onCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Создать сервис
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Доступно сервисов" value={services.length} hint="Inference-сервисы в демо-данных" />
        <SummaryCard label="Работают стабильно" value={services.filter((s) => s.status === 'Healthy').length} hint="Healthy · статусы сервисов" />
        <SummaryCard label="Production" value={services.filter((s) => s.env === 'Production').length} hint="В промышленном окружении" />
        <SummaryCard label="Команды" value={teams} hint="Владельцы inference-сервисов" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-2 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-9" placeholder="Поиск по имени, файлу, движку…" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={team} onChange={setTeam} options={[{ id: 'all', name: 'Все команды' }, ...TEAMS.map((t) => ({ id: t.name, name: t.name }))]} />
            <Select value={status} onChange={setStatus} options={[{ id: 'all', name: 'Любой статус' }, { id: 'Healthy', name: 'Healthy' }, { id: 'Degraded', name: 'Degraded' }, { id: 'Down', name: 'Down' }]} />
            <Select value={format} onChange={setFormat} options={[{ id: 'all', name: 'Все форматы' }, ...FORMATS]} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-y border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-semibold">Сервис / артефакт</th>
                <th className="px-3 py-3 font-semibold">Команда</th>
                <th className="px-3 py-3 font-semibold">Backend</th>
                <th className="px-3 py-3 font-semibold">Окружение</th>
                <th className="px-3 py-3 font-semibold">Статус</th>
                <th className="px-3 py-3 font-semibold">RPS / P99</th>
                <th className="px-3 py-3 font-semibold">Revision</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} onClick={() => onOpen(s)} className="cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <FormatIcon file={s.file} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-white">{s.name}</div>
                        <div className="truncate text-xs text-slate-500">{s.file}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="text-slate-200">{s.team}</div>
                    <div className="text-xs text-slate-500">{s.teamSlug}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-slate-200">{s.backend}</td>
                  <td className="px-3 py-3.5"><EnvBadge env={s.env} /></td>
                  <td className="px-3 py-3.5"><HealthDot s={s.status} /></td>
                  <td className="px-3 py-3.5">
                    <div className="font-semibold tabular-nums text-white">{fmtN(s.rps)}</div>
                    <div className="text-xs text-slate-500">{s.p99} ms</div>
                  </td>
                  <td className="px-3 py-3.5 text-slate-200">v{s.rev}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={(e) => { e.stopPropagation(); onOpen(s) }} className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-violet-400 hover:text-violet-300">
                      Открыть <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">Ничего не найдено — измените фильтры</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-1 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <span>Показано: {rows.length} из {services.length}</span>
          <span>Данные демонстрационные · без подключения к Kubernetes</span>
        </div>
      </div>
    </>
  )
}

type Field = { name: string; type: string; desc: string }
type Details = {
  desc: string
  task: string
  mode: 'Single Model' | 'Ensemble'
  inputs: Field[]
  outputs: Field[]
  cpu: string
  ram: string
  replicas: number
  smoke: 'PASSED' | 'FAILED'
  correctness: 'VERIFIED' | 'NOT_VERIFIED'
  errorRate: string
  uptime: string
}

const DETAILS: Record<string, Partial<Details>> = {
  'fraud-scoring': {
    desc: 'Определение риска операции на основе табличных признаков.',
    task: 'Binary classification',
    inputs: [
      { name: 'amount', type: 'float32', desc: 'Сумма операции' },
      { name: 'merchant_category', type: 'string', desc: 'Категория торговой точки' },
      { name: 'country_code', type: 'string', desc: 'Код страны' },
    ],
    outputs: [{ name: 'fraud_probability', type: 'float32', desc: 'Вероятность целевого класса' }],
  },
  'product-classifier': {
    desc: 'Классификация товаров по категориям каталога по названию и описанию.',
    task: 'Multiclass classification',
    cpu: '1× T4 GPU',
    ram: '16 GiB',
    correctness: 'VERIFIED',
    inputs: [
      { name: 'title', type: 'string', desc: 'Название товара' },
      { name: 'description', type: 'string', desc: 'Описание товара' },
    ],
    outputs: [
      { name: 'category_id', type: 'int64', desc: 'ID категории' },
      { name: 'score', type: 'float32', desc: 'Уверенность модели' },
    ],
  },
  'risk-ensemble': {
    desc: 'Ансамбль моделей риска: градиентный бустинг + нейросеть по последовательностям.',
    task: 'Binary classification',
    mode: 'Ensemble',
    replicas: 1,
  },
  'ranking-v2': {
    desc: 'Ранжирование товаров в ленте рекомендаций.',
    task: 'Learning to rank',
    replicas: 8,
    cpu: '8 CPU',
    ram: '16 GiB',
    correctness: 'VERIFIED',
    inputs: [
      { name: 'user_id', type: 'int64', desc: 'Пользователь' },
      { name: 'item_ids', type: 'int64[]', desc: 'Кандидаты для ранжирования' },
    ],
    outputs: [{ name: 'scores', type: 'float32[]', desc: 'Скоры кандидатов' }],
  },
  'fraud-experimental': { desc: 'Экспериментальная модель антифрода на новых признаках.', task: 'Binary classification', smoke: 'PASSED', errorRate: '1.4%', uptime: '98.70%', replicas: 1 },
  'search-quality': {
    desc: 'Оценка релевантности поисковой выдачи.',
    task: 'Regression',
    cpu: '1× T4 GPU',
    ram: '16 GiB',
    inputs: [
      { name: 'query', type: 'string', desc: 'Поисковый запрос' },
      { name: 'doc_id', type: 'int64', desc: 'Документ' },
    ],
    outputs: [{ name: 'relevance', type: 'float32', desc: 'Оценка релевантности' }],
  },
}

function details(s: Service): Details {
  const d = DETAILS[s.name.replace(/-copy(-\d+)?$/, '')] ?? {}
  return {
    desc: 'Inference-сервис, созданный через платформу.',
    task: 'Binary classification',
    mode: ext(s.file) === 'zip' ? 'Ensemble' : 'Single Model',
    inputs: [{ name: 'features', type: 'float32[]', desc: 'Вектор признаков' }],
    outputs: [{ name: 'prediction', type: 'float32', desc: 'Предсказание модели' }],
    cpu: '4 CPU',
    ram: '8 GiB',
    replicas: s.env === 'Production' ? 3 : 1,
    smoke: 'PASSED',
    correctness: 'NOT_VERIFIED',
    errorRate: '0.02%',
    uptime: '99.98%',
    ...d,
  }
}

const envShort = (e: Env) => (e === 'Production' ? 'prod' : 'dev')
const fmtDate = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date('2026-11-17T17:28:00')
  return `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '')}, ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-400">
      <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> {children}
    </div>
  )
}

function Pill({ tone, children }: { tone: 'green' | 'amber' | 'blue' | 'slate'; children: ReactNode }) {
  const c = { green: 'bg-emerald-500/10 text-emerald-400', amber: 'bg-amber-500/10 text-amber-400', blue: 'bg-blue-500/10 text-blue-400', slate: 'bg-white/[0.06] text-slate-400' }[tone]
  return <span className={cx('inline-flex whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium', c)}>{children}</span>
}

function KV({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{k}</dt>
          <dd className="mt-1.5 truncate font-semibold text-white">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-slate-400">{children}</div>
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="text-lg font-semibold tabular-nums text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  )
}

function FieldTable({ rows, tone }: { rows: Field[]; tone: 'blue' | 'green' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="w-[35%] px-4 py-2.5 font-semibold">Имя</th>
            <th className="w-[20%] px-4 py-2.5 font-semibold">Тип</th>
            <th className="px-4 py-2.5 font-semibold">Описание</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.name} className="border-t border-white/[0.04]">
              <td className="px-4 py-3 font-mono font-semibold text-white">{f.name}</td>
              <td className="px-4 py-3"><Pill tone={tone}>{f.type}</Pill></td>
              <td className="px-4 py-3 text-slate-400">{f.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type SvcTab = 'overview' | 'model' | 'tests' | 'monitoring' | 'history'

function ServiceView({ s, onBack, onRedeploy, onClone }: { s: Service; onBack: () => void; onRedeploy: (file: string) => void; onClone: () => void }) {
  const d = details(s)
  const [tab, setTab] = useState<SvcTab>('overview')
  const [copied, setCopied] = useState(false)
  const [modal, setModal] = useState(false)
  const [file, setFile] = useState('')
  const url = `https://auto-deploy.ai-studio.space/${s.name}`
  const bars = useMemo(() => series(26, s.rps, s.rps * 0.45, s.rev + s.name.length), [s.rps, s.rev, s.name])
  const max = Math.max(...bars)
  const history = s.history?.length ? s.history : [{ rev: s.rev, file: s.file, at: '' }]

  const tabs: { id: SvcTab; label: string }[] = [
    { id: 'overview', label: 'Обзор' },
    { id: 'model', label: 'Модель' },
    { id: 'tests', label: 'Тесты' },
    { id: 'monitoring', label: 'Мониторинг' },
    { id: 'history', label: 'История' },
  ]

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <button onClick={onBack} className="btn-ghost mb-4 px-3 py-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> К списку сервисов
          </button>
          <Eyebrow>Service details / ML Platform</Eyebrow>
          <h1 className="truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">{s.name}</h1>
          <p className="mt-2 text-sm text-slate-400">{d.mode} · {s.backend} · v{s.rev} · {envShort(s.env)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HealthDot s={s.status} />
          <button onClick={onClone} className="btn-ghost"><Copy className="h-4 w-4" /> Клонировать</button>
          <button onClick={() => setModal(true)} className="btn-primary"><RefreshCw className="h-4 w-4" /> Изменить модель / Redeploy</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx('relative whitespace-nowrap px-3 py-4 text-sm font-medium transition', tab === t.id ? 'text-violet-400' : 'text-slate-400 hover:text-white')}
            >
              {t.label}
              {tab === t.id && <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-violet-400" />}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          {tab === 'overview' && (
            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <div className="space-y-4">
                <Card>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">Публичный endpoint</h3>
                    <Pill tone="green">Stable URL</Pill>
                  </div>
                  <div className="theme-fixed rounded-xl bg-[#14111f] p-4 text-slate-300">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Production / development API</div>
                    <div className="mt-2 break-all font-mono text-sm text-white">{url}</div>
                    <div className="mt-3 border-t border-white/10 pt-3 text-xs text-slate-400">Нативный маршрут {s.backend}</div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(url).catch(() => {})
                        setCopied(true)
                        setTimeout(() => setCopied(false), 1500)
                      }}
                      className="btn-ghost px-3 py-1.5 text-xs"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Скопировано' : 'Скопировать адрес'}
                    </button>
                    <button onClick={() => setTab('model')} className="btn-ghost px-3 py-1.5 text-xs">Посмотреть контракт</button>
                  </div>
                </Card>
                <Card>
                  <h3 className="text-sm font-semibold text-white">Описание</h3>
                  <p className="mt-3 text-sm text-slate-400">{d.desc}</p>
                  <div className="my-5 h-px bg-white/[0.06]" />
                  <KV items={[['Тип', d.mode], ['Задача', d.task], ['Backend', s.backend], ['Артефакт', s.file], ['Окружение', s.env], ['Реплики', d.replicas]]} />
                </Card>
              </div>
              <div className="space-y-4">
                <Card>
                  <h3 className="text-sm font-semibold text-white">Статус</h3>
                  <div className="mt-3"><HealthDot s={s.status} /></div>
                  <div className="my-5 h-px bg-white/[0.06]" />
                  <KV items={[['RPS', fmtN(s.rps)], ['P99 latency', `${s.p99} ms`], ['CPU / GPU', d.cpu], ['RAM', d.ram]]} />
                </Card>
                <Card>
                  <h3 className="text-sm font-semibold text-white">Последнее обновление</h3>
                  <p className="mt-3 text-sm text-slate-500">{fmtDate(history[0].at)} · v{s.rev}</p>
                  <div className="mt-4"><Pill tone={d.correctness === 'VERIFIED' ? 'green' : 'amber'}>Correctness: {d.correctness}</Pill></div>
                  <button onClick={() => setTab('tests')} className="btn-ghost mt-4">Все проверки <ArrowRight className="h-4 w-4" /></button>
                </Card>
              </div>
            </div>
          )}

          {tab === 'model' && (
            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <Card>
                <h3 className="text-sm font-semibold text-white">Контракт модели и признаки</h3>
                <p className="mt-1 text-sm text-slate-500">Данные о модели и технический контракт входов и выходов.</p>
                <h4 className="mb-3 mt-5 text-sm font-semibold text-white">Входы / фичи</h4>
                <FieldTable rows={d.inputs} tone="blue" />
                <h4 className="mb-3 mt-6 text-sm font-semibold text-white">Выходы</h4>
                <FieldTable rows={d.outputs} tone="green" />
              </Card>
              <Card className="self-start">
                <h3 className="mb-5 text-sm font-semibold text-white">Model metadata</h3>
                <KV items={[['Название', s.name], ['Файл', s.file], ['Формат', ext(s.file)], ['Version', `v${s.rev}`], ['Команда', s.team], ['Режим', d.mode]]} />
                <div className="my-5 h-px bg-white/[0.06]" />
                <button onClick={() => setModal(true)} className="btn-primary"><RefreshCw className="h-4 w-4" /> Заменить модель и создать revision</button>
                <div className="mt-4"><Note>Артефакт, сигнатура и бизнес-семантика ответа должны иметь независимые версии в реальной реализации.</Note></div>
              </Card>
            </div>
          )}

          {tab === 'tests' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="card p-5">
                  <div className="text-xs font-medium text-slate-400">Smoke test</div>
                  <div className={cx('mt-3 text-2xl font-semibold', d.smoke === 'PASSED' ? 'text-white' : 'text-rose-400')}>{d.smoke}</div>
                  <div className="mt-2 text-xs text-slate-500">Контракт API и готовность</div>
                </div>
                <div className="card p-5">
                  <div className="text-xs font-medium text-slate-400">Correctness</div>
                  <div className={cx('mt-3 text-2xl font-semibold', d.correctness === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400')}>{d.correctness}</div>
                  <div className="mt-2 text-xs text-slate-500">{d.correctness === 'VERIFIED' ? 'Golden samples совпадают' : 'Golden samples отсутствуют'}</div>
                </div>
                <div className="card p-5">
                  <div className="text-xs font-medium text-slate-400">Benchmark</div>
                  <div className="mt-3 text-2xl font-semibold text-white">BASELINE</div>
                  <div className="mt-2 text-xs text-slate-500">Иллюстративный результат</div>
                </div>
              </div>
              <Card>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">Последний отчёт нагрузочного тестирования</h3>
                  <Pill tone="slate">Демо-данные</Pill>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniStat value={fmtN(s.rps)} label="Throughput RPS" />
                  <MiniStat value={`${s.p99} ms`} label="p99 latency" />
                  <MiniStat value={d.errorRate} label="Error rate" />
                </div>
                <div className="mt-4"><Note>Тестовые данные располагаются перед оптимизацией; отсутствие golden samples не блокирует benchmark, но не подтверждает корректность модели.</Note></div>
              </Card>
            </div>
          )}

          {tab === 'monitoring' && (
            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <Card>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">Inference requests · RPS</h3>
                  <Pill tone="slate">Демо-метрики</Pill>
                </div>
                <div className="flex h-24 items-end gap-1.5">
                  {bars.map((v, i) => (
                    <div
                      key={i}
                      title={`${fmtN(Math.round(v))} RPS`}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-violet-400 to-violet-600 transition hover:opacity-80"
                      style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  <MiniStat value={fmtN(s.rps)} label="RPS" />
                  <MiniStat value={`${s.p99} ms`} label="p99" />
                  <MiniStat value={d.uptime} label="Доступность" />
                </div>
                <div className="my-5 h-px bg-white/[0.06]" />
                <p className="text-xs text-slate-500">В реальной платформе здесь подключаются Grafana / Prometheus / Thanos и engine-specific метрики; числовые показатели демонстрационные.</p>
              </Card>
              <Card className="self-start">
                <h3 className="mb-5 text-sm font-semibold text-white">Runtime &amp; resources</h3>
                <KV items={[['Backend', s.backend], ['Replicas', d.replicas], ['CPU / GPU', d.cpu], ['Memory', d.ram], ['Окружение', envShort(s.env)], ['Health', s.status.toLowerCase()]]} />
              </Card>
            </div>
          )}

          {tab === 'history' && (
            <Card>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">Ревизии и операции</h3>
                  <p className="mt-1 text-sm text-slate-500">Новая публикация не меняет публичный URL.</p>
                </div>
                <Pill tone="green">Текущая v{s.rev}</Pill>
              </div>
              <div className="mt-4 divide-y divide-white/[0.06]">
                {history.map((h, i) => (
                  <div key={h.rev} className="flex items-center gap-3 py-3">
                    <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-lg', i === 0 ? 'bg-violet-500/15' : 'bg-white/[0.04]')}>
                      <span className={cx('h-1.5 w-1.5 rounded-full', i === 0 ? 'bg-violet-400' : 'bg-slate-500')} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white">{i === 0 ? `Текущая версия · v${h.rev}` : `v${h.rev}`}</div>
                      <div className="truncate text-xs text-slate-500">Артефакт: {h.file} · {fmtDate(h.at)} · {i === 0 ? 'активна' : 'архив'}</div>
                    </div>
                    {i > 0 && <button onClick={() => onRedeploy(h.file)} className="btn-ghost px-3 py-1.5 text-xs">Откатить</button>}
                  </div>
                ))}
              </div>
              <div className="mt-2"><Note><b className="text-slate-300">Как работает rollback:</b> выбираете старую версию, проверяете конфигурацию и выпускаете новую revision на её основе — без изменения запущенных Pod без проверок. Все действия появятся после подключения Auto Deploy backend.</Note></div>
            </Card>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Изменить модель / Redeploy">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Будет создана ревизия v{s.rev + 1}. Публичный URL не изменится, трафик переключится после smoke-теста.</p>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 px-4 py-5 text-sm text-slate-400 hover:border-violet-500/50">
            <Upload className="h-5 w-5" />
            {file ? <span className="font-mono text-white">{file}</span> : `Новый артефакт (.${ext(s.file)}) — или оставьте текущий ${s.file}`}
            <input type="file" hidden accept=".cbm,.onnx,.zip" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(false)} className="btn-ghost">Отмена</button>
            <button
              onClick={() => {
                onRedeploy(file || s.file)
                setFile('')
                setModal(false)
                setTab('history')
              }}
              className="btn-primary"
            >
              <RefreshCw className="h-4 w-4" /> Создать v{s.rev + 1}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function CreateService({ onCreate, onCancel }: { onCreate: (s: Service) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [file, setFile] = useState('')
  const [team, setTeam] = useState(TEAMS[0].name)
  const [backend, setBackend] = useState(BACKENDS[0])
  const [env, setEnv] = useState<Env>('Development')
  const valid = /^[a-z0-9][a-z0-9-]{1,40}$/.test(name) && !!file
  return (
    <>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-400">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> Новый сервис
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Создать inference-сервис</h1>
        <p className="mt-2 text-sm text-slate-400">Загрузите артефакт модели, выберите движок и окружение — сервис поднимется с REST/gRPC эндпоинтом.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Имя сервиса</label>
              <input value={name} onChange={(e) => setName(e.target.value.toLowerCase())} className="input font-mono" placeholder="fraud-scoring" />
              <p className="mt-1 text-xs text-slate-500">Латиница, цифры и дефис — используется в URL эндпоинта</p>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Артефакт модели</label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 px-4 py-5 text-sm text-slate-400 hover:border-violet-500/50">
                <Upload className="h-5 w-5" />
                {file ? <span className="font-mono text-white">{file}</span> : 'Выберите файл .cbm, .onnx или .zip (ансамбль)'}
                <input type="file" hidden accept=".cbm,.onnx,.zip" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />
              </label>
            </div>
            <div>
              <label className="label">Команда</label>
              <select value={team} onChange={(e) => setTeam(e.target.value)} className="input">{TEAMS.map((t) => <option key={t.slug}>{t.name}</option>)}</select>
            </div>
            <div>
              <label className="label">Backend</label>
              <select value={backend} onChange={(e) => setBackend(e.target.value)} className="input">{BACKENDS.map((b) => <option key={b}>{b}</option>)}</select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Окружение</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Development', 'Production'] as Env[]).map((e) => (
                  <button key={e} onClick={() => setEnv(e)} className={cx('rounded-xl border p-3 text-left text-sm transition', env === e ? 'border-violet-400/60 bg-violet-500/10 text-white' : 'border-white/10 text-slate-400 hover:border-white/20')}>
                    <div className="font-medium">{e}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{e === 'Production' ? 'Автомасштабирование, SLA 99.9%' : 'Одна реплика, для тестов'}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onCancel} className="btn-ghost">Отмена</button>
            <button
              disabled={!valid}
              onClick={() => {
                const t = TEAMS.find((x) => x.name === team) ?? TEAMS[0]
                onCreate({ id: `s${Date.now()}`, name, file, team: t.name, teamSlug: t.slug, backend, env, status: 'Healthy', rps: 0, p99: 0, rev: 1 })
              }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" /> Создать сервис
            </button>
          </div>
        </Card>
        <Card title="Что будет создано">
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex gap-2"><Layers className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" /> Деплоймент в Kubernetes с health-checks</li>
            <li className="flex gap-2"><Layers className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" /> REST и gRPC эндпоинты с токеном доступа</li>
            <li className="flex gap-2"><Layers className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" /> Метрики RPS / P99 и алерты по деградации</li>
            <li className="flex gap-2"><Layers className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" /> История ревизий с откатом в один клик</li>
          </ul>
        </Card>
      </div>
    </>
  )
}

export function MlInference() {
  const [services, setServices] = useState<Service[]>(load)
  const [tab, setTab] = useState<'list' | 'create'>('list')
  const [open, setOpen] = useState<Service | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(services))
    } catch {
      /* ignore */
    }
  }, [services])

  const tabCls = (on: boolean) => cx('inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition', on ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30' : 'text-slate-400 hover:text-white')

  return (
    <>
      {!(open && tab === 'list') && <div className="mb-6">
      <div className="inline-flex gap-1 rounded-2xl border border-white/[0.06] bg-ink-900 p-1.5">
        <button onClick={() => { setTab('list'); setOpen(null) }} className={tabCls(tab === 'list')}>
          <Layers className="h-4 w-4" /> Сервисы
        </button>
        <button onClick={() => { setTab('create'); setOpen(null) }} className={tabCls(tab === 'create')}>
          <Plus className="h-4 w-4" /> Создать сервис
        </button>
      </div>
      </div>}
      {tab === 'create' ? (
        <CreateService
          onCancel={() => setTab('list')}
          onCreate={(s) => {
            setServices((x) => [s, ...x])
            setTab('list')
            setOpen(s)
          }}
        />
      ) : open ? (
        <ServiceView
          key={open.id}
          s={open}
          onBack={() => setOpen(null)}
          onRedeploy={(file) => {
            const now = new Date().toISOString()
            const prev = open.history?.length ? open.history : [{ rev: open.rev, file: open.file, at: '' }]
            const next: Service = { ...open, file, rev: open.rev + 1, history: [{ rev: open.rev + 1, file, at: now }, ...prev] }
            setServices((x) => x.map((y) => (y.id === open.id ? next : y)))
            setOpen(next)
          }}
          onClone={() => {
            const base = `${open.name}-copy`
            let name = base
            for (let i = 2; services.some((x) => x.name === name); i++) name = `${base}-${i}`
            const c: Service = { ...open, id: `s${Date.now()}`, name, env: 'Development', rev: 1, history: undefined }
            setServices((x) => [c, ...x])
            setOpen(c)
          }}
        />
      ) : (
        <ServicesList services={services} onOpen={setOpen} onCreate={() => setTab('create')} />
      )}
    </>
  )
}
