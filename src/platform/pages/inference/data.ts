/* Inference services portal — demo data, roles and draft model.
 * UI-only simulation: no artifact inspection, no cluster calls. */

export type Env = 'prod' | 'dev'
export type Status = 'healthy' | 'warning' | 'stopped'
export type Fmt = 'cbm' | 'onnx' | 'ensemble'
export type Row = [string, string, string]

export type Snapshot = {
  id: string
  name: string
  team: string
  type: 'Single Model' | 'Ensemble'
  model: string
  fmt: Fmt
  engine: string
  env: Env
  status: Status
  rev: string
  rps: string
  p99: string
  cpu: string
  mem: string
  replicas: number
  last: string
  description: string
  path: string
  task: string
  golden: boolean
  features: Row[]
  outputs: Row[]
  engineModelName?: string
}
export type AuditEvent = { rev: string; from: string; what: string; artifact: string; previousArtifact: string; backend: string; at: string }
export type Service = Snapshot & { previousVersions?: Snapshot[]; auditEvents?: AuditEvent[] }

export const DOMAIN = 'https://auto-deploy.ai-studio.space'
export const GO = 'mircurius-online-inference'
export const TRITON = 'NVIDIA Triton'

/* ---------------- roles ---------------- */
export const TEAM_META: Record<string, string> = { 'ml-platform': 'ML Platform', recommendations: 'Рекомендации', 'risk-models': 'Risk Models', search: 'Search & Ranking' }
export type Level = 'read' | 'write' | 'exec' | 'admin'
export const ROLE_LEVEL: Record<Level, number> = { read: 1, write: 2, exec: 3, admin: 4 }
export const LEVEL_LABEL: Record<Level, string> = { read: 'Просмотр', write: 'Dev и тесты', exec: 'Prod deployment', admin: 'Владелец команды' }
export type PersonaId = 'engineer' | 'writer' | 'reader' | 'owner' | 'global' | 'none'
export const PERSONAS: Record<PersonaId, { label: string; option: string; roles: string[] }> = {
  engineer: { label: 'Инженер', option: 'Инженер · exec', roles: ['ml-platform:exec', 'recommendations:read'] },
  writer: { label: 'Разработчик', option: 'Разработчик · write', roles: ['ml-platform:write', 'recommendations:read'] },
  reader: { label: 'Наблюдатель', option: 'Наблюдатель · read', roles: ['ml-platform:read'] },
  owner: { label: 'Владелец команды', option: 'Владелец команды · admin', roles: ['ml-platform:admin', 'risk-models:read'] },
  global: { label: 'Администратор платформы', option: 'Глобальный admin', roles: ['admin'] },
  none: { label: 'Без доступа', option: 'Без прав', roles: [] },
}

export function access(persona: PersonaId) {
  const roles = PERSONAS[persona].roles
  const global = roles.includes('admin')
  const roleFor = (team: string): Level | null => {
    if (global) return 'admin'
    const lv = roles.filter((r) => r.startsWith(team + ':')).map((r) => r.slice(team.length + 1) as Level).filter((r) => ROLE_LEVEL[r])
    return lv.sort((a, b) => ROLE_LEVEL[b] - ROLE_LEVEL[a])[0] ?? null
  }
  const has = (team: string, min: Level) => global || (ROLE_LEVEL[roleFor(team) as Level] ?? 0) >= ROLE_LEVEL[min]
  const teams = (min: Level = 'read') => Object.keys(TEAM_META).filter((t) => has(t, min))
  const adminTeams = () => teams('admin')
  const canAdmin = () => global || adminTeams().length > 0
  const recommended = (): { team: string; role: Level } => {
    if (global) return { team: 'ml-platform', role: 'read' }
    const t = teams('read')
    if (!t.length) return { team: 'ml-platform', role: 'read' }
    const cur = roleFor(t[0])
    return { team: t[0], role: cur === 'read' ? 'write' : cur === 'write' ? 'exec' : 'admin' }
  }
  return { roles, global, roleFor, has, teams, adminTeams, canAdmin, recommended }
}
export type Access = ReturnType<typeof access>
export const teamLabel = (t: string) => TEAM_META[t] || t || 'Нет команды'

/* ---------------- demo services ---------------- */
export const DEMO: Service[] = [
  { id: 'fraud-scoring', name: 'fraud-scoring', team: 'ml-platform', type: 'Single Model', model: 'fraud_scoring.cbm', fmt: 'cbm', engine: GO, env: 'prod', status: 'healthy', rev: 'v12', rps: '2 480', p99: '17 ms', cpu: '4 CPU', mem: '8 GiB', replicas: 3, last: '17 ноя, 14:28', description: 'Определение риска операции на основе табличных признаков.', path: 'fraud-scoring', task: 'Binary classification', golden: false, features: [['amount', 'float', 'Сумма операции'], ['merchant_category', 'string', 'Категория торговой точки'], ['country_code', 'string', 'Код страны']], outputs: [['fraud_probability', 'float32', 'Вероятность целевого класса']],
    previousVersions: [{ id: 'fraud-scoring', name: 'fraud-scoring', team: 'ml-platform', type: 'Single Model', model: 'fraud_scoring_v11.cbm', fmt: 'cbm', engine: GO, env: 'prod', status: 'healthy', rev: 'v11', rps: '2 300', p99: '19 ms', cpu: '4 CPU', mem: '8 GiB', replicas: 3, last: '02 ноя, 12:10', description: 'Определение риска операции на основе табличных признаков.', path: 'fraud-scoring', task: 'Binary classification', golden: false, features: [['amount', 'float', 'Сумма операции'], ['merchant_category', 'string', 'Категория торговой точки']], outputs: [['fraud_probability', 'float32', 'Вероятность целевого класса']] }] },
  { id: 'product-classifier', name: 'product-classifier', team: 'ml-platform', type: 'Single Model', model: 'classifier.onnx', fmt: 'onnx', engine: TRITON, env: 'prod', status: 'healthy', rev: 'v8', rps: '8 120', p99: '24 ms', cpu: '2 CPU + GPU', mem: '16 GiB', replicas: 4, last: '18 ноя, 10:42', description: 'Классификация объектов по выходным тензорам ONNX.', path: 'product-classifier', task: 'Classification', golden: true, features: [['input', 'float32[1,128]', 'Тензор входных данных']], outputs: [['probabilities', 'float32[1,8]', 'Оценки классов']] },
  { id: 'risk-ensemble', name: 'risk-ensemble', team: 'ml-platform', type: 'Ensemble', model: 'risk_ensemble.zip', fmt: 'ensemble', engine: TRITON, env: 'dev', status: 'healthy', rev: 'v3', rps: '920', p99: '35 ms', cpu: '8 CPU + GPU', mem: '24 GiB', replicas: 2, last: '18 ноя, 09:05', description: 'Загруженный Triton ансамбль из нескольких моделей.', path: 'risk-ensemble', task: 'Ensemble / Pipeline', golden: false, features: [['INPUT', 'FP32[1,10]', 'Вход ансамбля']], outputs: [['OUTPUT', 'FP32[1,2]', 'Итоговые тензоры']] },
  { id: 'ranking-v2', name: 'ranking-v2', team: 'recommendations', type: 'Single Model', model: 'ranking_model.cbm', fmt: 'cbm', engine: GO, env: 'prod', status: 'healthy', rev: 'v21', rps: '14 300', p99: '11 ms', cpu: '8 CPU', mem: '16 GiB', replicas: 8, last: '17 ноя, 18:26', description: 'Ранжирование кандидатов для рекомендаций.', path: 'ranking-v2', task: 'Ranking', golden: true, features: [['features', 'float32[]', 'Вектор признаков']], outputs: [['score', 'float32', 'Скор релевантности']] },
  { id: 'fraud-experimental', name: 'fraud-experimental', team: 'risk-models', type: 'Single Model', model: 'risk_v4.onnx', fmt: 'onnx', engine: TRITON, env: 'dev', status: 'warning', rev: 'v4', rps: '530', p99: '82 ms', cpu: '4 CPU', mem: '12 GiB', replicas: 1, last: '16 ноя, 11:10', description: 'Экспериментальная версия скоринговой модели.', path: 'fraud-experimental', task: 'Classification', golden: false, features: [['input', 'float32[1,32]', 'Тензор входов']], outputs: [['score', 'float32[1,1]', 'Результат']] },
  { id: 'search-quality', name: 'search-quality', team: 'search', type: 'Single Model', model: 'search_quality.onnx', fmt: 'onnx', engine: TRITON, env: 'prod', status: 'healthy', rev: 'v7', rps: '4 880', p99: '28 ms', cpu: '6 CPU + GPU', mem: '12 GiB', replicas: 3, last: '17 ноя, 17:44', description: 'Оценка качества поисковой выдачи.', path: 'search-quality', task: 'Regression', golden: true, features: [['features', 'float32[1,64]', 'Вектор признаков']], outputs: [['score', 'float32[1,1]', 'Рейтинг']] },
]

/* ---------------- draft (create / redeploy form) ---------------- */
export type Field = { name: string; dtype: string; shape: string; desc: string; src: string }
export type SectionId = 'model' | 'contract' | 'engine' | 'test' | 'opt' | 'launch'
export type Backend = 'auto' | 'go' | 'triton'
export type Draft = {
  team: string; environment: Env; kind: 'single' | 'ensemble'; source: 'file' | 'uri' | 'clearml' | 'mlflow'; format: 'cbm' | 'onnx'
  artifact: string; modelLoaded: boolean; fixture: boolean; sourceUri: string; registryId: string
  serviceName: string; publicPath: string; engineModelName: string; nameTouched: boolean; pathTouched: boolean; engineNameTouched: boolean
  description: string; task: string; features: Field[]; outputs: Field[]; signatureStatus: 'empty' | 'example' | 'manual' | 'not_inspected'
  backend: Backend; goVersion: string; tritonVersion: string
  testInput: string; goldenEnabled: boolean; golden: string; datasetName: string; testProfile: string
  mode: 'auto' | 'sla' | 'manual'; optGoal: string; rps: string; p99: string; errorRate: string
  cpu: string; ram: string; replicas: string; workers: string; batch: string; gpu: string; runtimeExtra: string
  open: Record<SectionId, boolean>
}
export const INITIAL: Draft = {
  team: 'ml-platform', environment: 'dev', kind: 'single', source: 'file', format: 'onnx', artifact: '', modelLoaded: false, fixture: false, sourceUri: '', registryId: '',
  serviceName: '', publicPath: '', engineModelName: '', nameTouched: false, pathTouched: false, engineNameTouched: false,
  description: '', task: 'unknown', features: [], outputs: [], signatureStatus: 'empty', backend: 'auto', goVersion: 'approved', tritonVersion: 'approved',
  testInput: '', goldenEnabled: false, golden: '', datasetName: '', testProfile: 'steady', mode: 'auto', optGoal: 'balanced', rps: '1000', p99: '40', errorRate: '0.1',
  cpu: '4', ram: '8', replicas: '2', workers: '4', batch: '1', gpu: 'none', runtimeExtra: '',
  open: { model: true, contract: true, engine: true, test: true, opt: true, launch: true },
}
export const fresh = (): Draft => structuredClone(INITIAL)

export const slug = (v: string) => String(v || '').toLowerCase().trim().replace(/\.(cbm|onnx|zip|tar|gz)$/i, '').replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 63)

const f = (name: string, dtype: string, shape: string, desc: string): Field => ({ name, dtype, shape, desc, src: 'example' })
export const FIXTURES = {
  cbm: { artifact: 'fraud_scoring.cbm', format: 'cbm' as const, serviceName: 'fraud-scoring', engineModelName: 'fraud_scoring', description: 'Модель оценки риска операции по табличным признакам.', task: 'classification',
    features: [f('amount', 'float32', 'scalar', 'Сумма операции'), f('merchant_category', 'category', 'scalar', 'Категория продавца'), f('days_since_signup', 'float32', 'scalar', 'Число дней с регистрации')],
    outputs: [f('score', 'float32', 'scalar', 'Оценка риска (семантику подтвердить)')], testInput: JSON.stringify({ inputs: [{ amount: 1500, merchant_category: 'grocery', days_since_signup: 24 }] }, null, 2) },
  onnx: { artifact: 'product_classifier.onnx', format: 'onnx' as const, serviceName: 'product-classifier', engineModelName: 'product_classifier', description: 'Классификация объектов по числовому вектору признаков.', task: 'classification',
    features: [f('features', 'float32', '[batch, 16]', 'Вектор из 16 входных признаков')], outputs: [f('scores', 'float32', '[batch, 4]', 'Выходные оценки классов (семантику подтвердить)')],
    testInput: JSON.stringify({ inputs: [{ name: 'features', shape: [1, 16], datatype: 'FP32', data: Array(16).fill(0) }] }, null, 2) },
  ensemble: { artifact: 'risk_ensemble.zip', format: 'onnx' as const, serviceName: 'risk-ensemble', engineModelName: 'risk_ensemble', description: 'Подготовленный ансамбль моделей с входными и выходными тензорами.', task: 'pipeline',
    features: [f('INPUT', 'float32', '[batch, 16]', 'Публичный вход ансамбля')], outputs: [f('OUTPUT', 'float32', '[batch, 2]', 'Публичный выход ансамбля')],
    testInput: JSON.stringify({ inputs: [{ name: 'INPUT', shape: [1, 16], datatype: 'FP32', data: Array(16).fill(0) }] }, null, 2) },
}
export type FixtureKey = keyof typeof FIXTURES

export const fmtOf = (S: Draft) => (S.kind === 'ensemble' ? 'ensemble' : S.format)
export function backendOptions(S: Draft): Backend[] {
  if (S.kind === 'ensemble') return S.format === 'cbm' ? ['go'] : ['go', 'triton']
  return S.format === 'cbm' ? ['go'] : ['auto', 'go', 'triton']
}
export function normalize(S: Draft): Draft {
  const allowed = backendOptions(S)
  let backend = S.backend
  if (!allowed.includes(backend)) backend = allowed[0]
  if (S.kind === 'single' && S.format === 'cbm') backend = 'go'
  return backend === S.backend ? S : { ...S, backend }
}
export const backendLabel = (v: Backend) => (v === 'auto' ? 'Автовыбор по benchmark' : v === 'go' ? GO : TRITON)
export const publicUrl = (S: Draft) => `${DOMAIN}/${S.publicPath || '{public_path}'}`
export function nativeRoute(S: Draft) {
  if (S.backend === 'triton' || (S.kind === 'ensemble' && S.format !== 'cbm' && S.backend !== 'go')) return `/v2/models/${S.engineModelName || '{engine_model_name}'}/infer`
  if (S.backend === 'auto') return 'Нативный маршрут после выбора backend'
  return 'Нативный маршрут Go backend (определяется API)'
}
export const testReady = (S: Draft) => {
  try { if (!S.testInput.trim()) return false; JSON.parse(S.testInput); return true } catch { return false }
}
export const modelReady = (S: Draft) => !!S.artifact || (S.source !== 'file' && !!(S.sourceUri || S.registryId))
export const contractReady = (S: Draft) => S.features.length > 0 && S.outputs.length > 0 && S.features.every((x) => x.name && x.dtype) && S.outputs.every((x) => x.name && x.dtype)
export const validPath = (S: Draft) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(S.publicPath)
export const modeLabel = (m: Draft['mode']) => (m === 'auto' ? 'Auto-select' : m === 'sla' ? 'Target SLA' : 'Manual')

export function missing(S: Draft) {
  const m: string[] = []
  if (!S.serviceName) m.push('название сервиса')
  if (!validPath(S)) m.push('публичный путь')
  if (!modelReady(S)) m.push('артефакт модели')
  if (!contractReady(S)) m.push('входы/выходы модели')
  if (!testReady(S)) m.push('валидный тестовый запрос')
  return m
}

export function withName(S: Draft, name: string): Draft {
  const s = slug(name) || 'model'
  return { ...S, serviceName: S.nameTouched ? S.serviceName : s, publicPath: S.pathTouched ? S.publicPath : s, engineModelName: S.engineNameTouched ? S.engineModelName : s.replace(/-/g, '_') }
}

export function withDemo(S: Draft, kind: FixtureKey): Draft {
  const fx = structuredClone(FIXTURES[kind])
  let n: Draft = { ...S, kind: kind === 'ensemble' ? 'ensemble' : 'single', artifact: fx.artifact, modelLoaded: true, fixture: true, format: fx.format, features: fx.features, outputs: fx.outputs,
    description: fx.description, task: fx.task, testInput: fx.testInput, signatureStatus: 'example', source: 'file', backend: kind === 'cbm' ? 'go' : kind === 'ensemble' ? 'triton' : 'auto' }
  n = withName(n, fx.serviceName)
  if (!S.engineNameTouched) n.engineModelName = fx.engineModelName
  return n
}

export function sampleFromSchema(S: Draft): string | null {
  if (!S.features.length) return null
  const tensor = S.backend === 'triton' || S.features.some((x) => String(x.shape).includes('batch'))
  if (tensor) {
    const inputs = S.features.map((x) => {
      const datatype = x.dtype === 'float32' ? 'FP32' : x.dtype === 'int64' ? 'INT64' : x.dtype === 'string' ? 'BYTES' : 'FP32'
      const n = Math.max(1, Math.min(32, Number((x.shape.match(/\d+/) || [])[0] || 1)))
      return { name: x.name, datatype, shape: [1, n], data: Array(n).fill(datatype === 'BYTES' ? 'sample' : 0) }
    })
    return JSON.stringify({ inputs }, null, 2)
  }
  return JSON.stringify({ inputs: [Object.fromEntries(S.features.map((x) => [x.name, x.dtype === 'category' || x.dtype === 'string' ? 'sample' : x.dtype === 'bool' ? false : 0]))] }, null, 2)
}

export function suggestDescriptions(S: Draft): Draft {
  return {
    ...S,
    description: S.description.trim() ? S.description : `Модель ${S.serviceName || S.artifact || 'inference'} для выполнения предсказаний. Назначение требует подтверждения владельцем.`,
    features: S.features.map((x) => ({ ...x, desc: x.desc || `Признак ${x.name}: смысл и единицы измерения требуется уточнить` })),
    outputs: S.outputs.map((x) => ({ ...x, desc: x.desc || `Выход ${x.name}: семантика требует подтверждения` })),
  }
}

export type EditContext = { id: string; previous: Service; restore: string | null }

export function buildSpec(S: Draft, edit: EditContext | null) {
  return {
    schema: 'ai-studio.inference.ux-demo/v0.2',
    revision_operation: edit ? { kind: 'redeploy', service_id: edit.id, from_revision: edit.previous.rev, stable_public_path: edit.previous.path, restore: edit.restore } : { kind: 'create' },
    disclaimer: 'UX DEMO; no CBM/ONNX introspection; no infrastructure deployment',
    service: { team: S.team, environment: S.environment, name: S.serviceName, public_path: S.publicPath, public_url: publicUrl(S), engine_model_name: S.engineModelName, type: S.kind },
    artifact: { source: S.source, file_name: S.artifact, source_uri: S.sourceUri, registry_id: S.registryId, format: fmtOf(S), metadata_origin: S.fixture ? 'demo_fixture' : 'user_input_or_uninspected_file' },
    model: { description: S.description, task: S.task, inputs: S.features, outputs: S.outputs },
    serving: { backend: S.backend, go_version: S.goVersion, triton_version: S.tritonVersion },
    testing: { sample_request: S.testInput, golden_enabled: S.goldenEnabled, golden_response: S.goldenEnabled ? S.golden : null, benchmark_dataset: S.datasetName, load_profile: S.testProfile, correctness_status: S.goldenEnabled ? 'TO_BE_VALIDATED' : 'NOT_VERIFIED' },
    optimization: S.mode === 'auto' ? { mode: 'auto', goal: S.optGoal } : S.mode === 'sla' ? { mode: 'sla', target_rps: Number(S.rps), p99_ms: Number(S.p99), max_error_percent: Number(S.errorRate) } : { mode: 'manual', cpu: Number(S.cpu), memory_gib: Number(S.ram), replicas: Number(S.replicas), workers: Number(S.workers), max_batch_size: Number(S.batch), gpu: S.gpu },
    advanced: { runtimeExtra: S.runtimeExtra },
  }
}

export function downloadSpec(S: Draft, edit: EditContext | null) {
  const blob = new Blob([JSON.stringify(buildSpec(S, edit), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (slug(S.serviceName) || 'inference') + '-draft.json'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

const featureForEdit = (t: Row): Field => ({
  name: String(t[0]), dtype: /^float\d*/.test(t[1]) ? 'float32' : /string|category/i.test(t[1]) ? 'string' : 'float32',
  shape: String(t[1]).includes('[') ? String(t[1]).replace(/^.*?\[/, '[') : 'scalar', desc: t[2] || '', src: 'demo_snapshot',
})
export function draftFromService(s: Snapshot): Draft {
  const S = fresh()
  const kind = s.type === 'Ensemble' ? 'ensemble' : 'single'
  return {
    ...S, team: s.team, environment: s.env, serviceName: s.name, publicPath: s.path, engineModelName: s.engineModelName || s.name.replace(/-/g, '_'),
    nameTouched: true, pathTouched: true, engineNameTouched: true, kind, format: s.fmt === 'cbm' ? 'cbm' : 'onnx', backend: s.engine.includes('Triton') ? 'triton' : 'go',
    source: 'file', artifact: s.model, modelLoaded: true, fixture: true, signatureStatus: 'example', description: s.description,
    task: ['Classification', 'Binary classification'].includes(s.task) ? 'classification' : s.task === 'Ranking' ? 'ranking' : s.task === 'Regression' ? 'regression' : kind === 'ensemble' ? 'pipeline' : 'unknown',
    features: s.features.map(featureForEdit), outputs: s.outputs.map(featureForEdit),
    testInput: FIXTURES[s.fmt === 'cbm' ? 'cbm' : s.fmt === 'ensemble' ? 'ensemble' : 'onnx'].testInput,
    goldenEnabled: !!s.golden, golden: s.golden ? 'Демо: ранее подтверждённые эталоны; повторно проверьте для новой модели' : '',
    mode: 'auto', replicas: String(s.replicas), cpu: String(parseInt(s.cpu) || 4), ram: String(parseInt(s.mem) || 8),
  }
}

export const revNum = (r: string) => Number(String(r).replace(/[^\d]/g, '')) || 0

export function applyRevision(s: Service, S: Draft, edit: EditContext): Service {
  const old = edit.previous
  const prev: Snapshot = { ...s }
  delete (prev as Service).previousVersions
  delete (prev as Service).auditEvents
  const rev = 'v' + (revNum(s.rev) + 1)
  const engine = S.backend === 'triton' ? TRITON : S.backend === 'go' ? GO : s.engine.includes('Triton') ? TRITON : GO
  const model = S.artifact || S.registryId || S.sourceUri
  const toRow = (x: Field): Row => [x.name, x.dtype + (x.shape && !['scalar', ''].includes(x.shape) ? x.shape : ''), x.desc || '—']
  const next: Service = {
    ...s, rev, model, fmt: S.kind === 'ensemble' ? 'ensemble' : S.format, type: S.kind === 'ensemble' ? 'Ensemble' : 'Single Model', engine,
    engineModelName: S.engineModelName, description: S.description, golden: S.goldenEnabled && !!S.golden.trim(),
    features: S.features.map(toRow), outputs: S.outputs.map(toRow),
    task: S.task === 'classification' ? 'Classification' : S.task === 'regression' ? 'Regression' : S.task === 'ranking' ? 'Ranking' : S.task === 'pipeline' ? 'Ensemble / Pipeline' : S.task,
    last: 'сейчас · симуляция', status: 'healthy',
    previousVersions: [prev, ...(s.previousVersions || [])].slice(0, 15),
    auditEvents: [{ rev, from: old.rev, what: edit.restore ? 'Rollback / восстановление из ' + edit.restore : 'Redeploy', artifact: model, previousArtifact: old.model, backend: engine, at: 'сейчас · демо' }, ...(s.auditEvents || [])],
  }
  if (S.mode === 'manual') {
    next.replicas = Number(S.replicas) || s.replicas
    next.cpu = Number(S.cpu) + ' CPU' + (S.gpu !== 'none' ? ' + ' + S.gpu.toUpperCase() : '')
    next.mem = S.ram + ' GiB'
  }
  return next
}

export function serviceFromDraft(S: Draft): Service {
  const toRow = (x: Field): Row => [x.name, x.dtype + (x.shape && !['scalar', ''].includes(x.shape) ? x.shape : ''), x.desc || '—']
  return {
    id: S.publicPath, name: S.serviceName, team: S.team, type: S.kind === 'ensemble' ? 'Ensemble' : 'Single Model', model: S.artifact || S.registryId || S.sourceUri,
    fmt: S.kind === 'ensemble' ? 'ensemble' : S.format, engine: S.backend === 'triton' ? TRITON : GO, env: S.environment, status: 'healthy', rev: 'v1',
    rps: '—', p99: '—', cpu: S.mode === 'manual' ? `${S.cpu} CPU` : '4 CPU', mem: S.mode === 'manual' ? `${S.ram} GiB` : '8 GiB', replicas: Number(S.replicas) || 2,
    last: 'сейчас · симуляция', description: S.description, path: S.publicPath, task: S.task, golden: S.goldenEnabled, features: S.features.map(toRow), outputs: S.outputs.map(toRow),
    engineModelName: S.engineModelName,
  }
}
