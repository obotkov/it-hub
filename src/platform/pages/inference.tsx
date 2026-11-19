import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Copy, Diamond, GitFork, Grid3x3, Layers, Plus, Search, Upload } from 'lucide-react'
import { Card, Code, cx } from '../../components/ui'
import { LineChart, series } from '../../components/charts'

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

function ServiceView({ s, onBack }: { s: Service; onBack: () => void }) {
  const [copied, setCopied] = useState(false)
  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const revs = Array.from({ length: Math.min(s.rev, 5) }, (_, i) => s.rev - i)
  return (
    <>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Все сервисы
      </button>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <FormatIcon file={s.file} />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-white">{s.name}</h1>
              <EnvBadge env={s.env} />
              <HealthDot s={s.status} />
            </div>
            <p className="mt-1 text-sm text-slate-400">{s.file} · {s.backend} · {s.team} · v{s.rev}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost">Откатить ревизию</button>
          <button className="btn-primary"><Upload className="h-4 w-4" /> Новая ревизия</button>
        </div>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="RPS" value={s.rps} hint="Запросов в секунду, сейчас" />
        <SummaryCard label="P99, ms" value={s.p99} hint="Задержка 99-го перцентиля" />
        <SummaryCard label="Реплики" value={s.env === 'Production' ? 6 : 1} hint={s.env === 'Production' ? 'Автомасштабирование 2–12' : 'Фиксированно'} />
        <SummaryCard label="Ревизия" value={s.rev} hint="Текущая активная версия" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Нагрузка, RPS за 24 часа" className="lg:col-span-2">
          <LineChart series={[{ name: 'rps', data: series(24, s.rps, s.rps * 0.35, s.rev), color: '#a78bfa' }]} labels={labels} />
        </Card>
        <Card title="История ревизий">
          <div className="space-y-2">
            {revs.map((r, i) => (
              <div key={r} className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2 text-sm">
                <span className="font-medium text-white">v{r}</span>
                <span className="text-xs text-slate-500">{i === 0 ? 'активна' : `${i * 4} дн. назад`}</span>
                {i === 0 ? <Check className="h-4 w-4 text-emerald-400" /> : <button className="text-xs text-violet-400 hover:text-violet-300">Откатить</button>}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Вызов сервиса" className="lg:col-span-3">
          <div className="relative">
            <Code>{`curl -X POST https://inference.ai-studio.space/v1/${s.name}/predict \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"inputs": [{"features": [0.42, 1.7, 3]}]}'`}</Code>
            <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="absolute right-2 top-2 rounded-lg bg-white/5 p-1.5 text-slate-400 hover:text-white">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </Card>
      </div>
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
      <div className="mb-6">
      <div className="inline-flex gap-1 rounded-2xl border border-white/[0.06] bg-ink-900 p-1.5">
        <button onClick={() => { setTab('list'); setOpen(null) }} className={tabCls(tab === 'list')}>
          <Layers className="h-4 w-4" /> Сервисы
        </button>
        <button onClick={() => { setTab('create'); setOpen(null) }} className={tabCls(tab === 'create')}>
          <Plus className="h-4 w-4" /> Создать сервис
        </button>
      </div>
      </div>
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
        <ServiceView s={open} onBack={() => setOpen(null)} />
      ) : (
        <ServicesList services={services} onOpen={setOpen} onCreate={() => setTab('create')} />
      )}
    </>
  )
}
