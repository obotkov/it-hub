import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Copy, Diamond, ExternalLink, GitFork, Grid3x3, KeyRound, Layers, Loader2, Plus, RefreshCw, Rocket, RotateCcw, Search, Settings } from 'lucide-react'
import { Modal, PageHeader, Tabs, cx } from '../../../components/ui'
import {
  DEMO, DOMAIN, Draft, EditContext, LEVEL_LABEL, Level, PERSONAS, PersonaId, ROLE_LEVEL, Service, TEAM_META,
  Access, access, applyRevision, contractReady, downloadSpec, draftFromService, fresh, missing, modelReady, normalize, publicUrl, revNum, serviceFromDraft, teamLabel, testReady, validPath,
} from './data'
import { ServiceForm } from './form'
import { AccessButton, Chip, InfoRow, KV, Kicker, MissingPermission, Note, StatusChip } from './ui'

type View = 'list' | 'detail' | 'create' | 'admin'
type DetailTab = 'overview' | 'model' | 'tests' | 'monitoring' | 'history'
type AdminTab = 'overview' | 'teams' | 'policies' | 'infrastructure'
type ModalState = null | { kind: 'access'; team: string; role: Level } | { kind: 'deploy' } | { kind: 'redeploy' }

const SKEY = 'hub.inference.v2'
const DKEY = 'hub.inference.draft'
const load = (): Service[] => {
  try { const v = JSON.parse(localStorage.getItem(SKEY) || 'null'); if (Array.isArray(v) && v.length) return v } catch { /* ignore */ }
  return structuredClone(DEMO)
}

function FmtIcon({ fmt }: { fmt: Service['fmt'] }) {
  const Icon = fmt === 'cbm' ? Diamond : fmt === 'ensemble' ? GitFork : Grid3x3
  return <div className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-ink-800', fmt === 'cbm' ? 'text-emerald-300' : fmt === 'ensemble' ? 'text-violet-300' : 'text-slate-300')}><Icon className="h-4 w-4" /></div>
}
const EnvChip = ({ env }: { env: Service['env'] }) => <Chip tone={env === 'prod' ? 'violet' : 'slate'}>{env === 'prod' ? 'Production' : 'Development'}</Chip>
const Stat = ({ k, v, note }: { k: string; v: string | number; note: string }) => (
  <div className="card p-5"><div className="text-[13px] text-slate-400">{k}</div><div className="meter mt-2 text-[28px] font-medium text-white">{v}</div><div className="mt-1 text-xs text-slate-500">{note}</div></div>
)

export function MlInference() {
  const [persona, setPersona] = useState<PersonaId>('engineer')
  const acc = useMemo(() => access(persona), [persona])
  const [services, setServices] = useState<Service[]>(load)
  const [view, setView] = useState<View>('list')
  const [currentId, setCurrentId] = useState('fraud-scoring')
  const [detailTab, setDetailTab] = useState<DetailTab>('overview')
  const [adminTab, setAdminTab] = useState<AdminTab>('overview')
  const [q, setQ] = useState('')
  const [teamF, setTeamF] = useState('all')
  const [statusF, setStatusF] = useState('all')
  const [fmtF, setFmtF] = useState('all')
  const [S, setS] = useState<Draft>(() => {
    try { const d = JSON.parse(localStorage.getItem(DKEY) || 'null'); if (d?.open && d?.kind) return { ...fresh(), ...d } } catch { /* ignore */ }
    return fresh()
  })
  const [edit, setEdit] = useState<EditContext | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [toastText, setToastText] = useState('')
  const toastTimer = useRef<number>()

  useEffect(() => { try { localStorage.setItem(SKEY, JSON.stringify(services)) } catch { /* ignore */ } }, [services])
  const toast = (t: string) => { setToastText(t); clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToastText(''), 4000) }
  const set = (fn: (s: Draft) => Draft) => setS((s) => normalize(fn(s)))
  const request = (team: string, role: Level) => setModal({ kind: 'access', team, role })
  const current = services.find((s) => s.id === currentId)

  const go = (next: View) => {
    if (next === 'admin' && !acc.canAdmin()) { request(acc.recommended().team, 'admin'); return }
    if (next === 'create' && !acc.teams('write').length) { request(acc.recommended().team, 'write'); return }
    if (next === 'create' && !acc.has(S.team, 'write')) set((s) => ({ ...s, team: acc.teams('write')[0] }))
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openCreate = () => { if (edit) { setEdit(null); setS(fresh()) } go('create') }
  const openDetail = (id: string, tab: DetailTab = 'overview') => {
    const s = services.find((x) => x.id === id)
    if (!s) return
    if (!acc.has(s.team, 'read')) { request(s.team, 'read'); return }
    setCurrentId(id); setDetailTab(tab); go('detail')
  }

  // persona change: drop views the new role can't see
  const changePersona = (p: PersonaId) => {
    const a = access(p)
    setPersona(p); setTeamF('all')
    let v = view
    if (v === 'detail' && current && !a.has(current.team, 'read')) v = 'list'
    if (v === 'create' && !a.teams('write').length) v = 'list'
    if (edit && !a.has(edit.previous.team, edit.previous.env === 'prod' ? 'exec' : 'write')) { setEdit(null); setS(fresh()); v = 'list' }
    if (v === 'admin' && !a.canAdmin()) v = 'list'
    if (adminTab === 'infrastructure' && !a.global) setAdminTab('overview')
    setView(v)
    toast('Демо-права обновлены. В реальном продукте они берутся из подтверждённого токена SSO.')
  }

  const beginRedeploy = (s: Service, restore: string | null = null) => {
    const req = s.env === 'prod' ? 'exec' : 'write'
    if (!acc.has(s.team, req)) { request(s.team, req); return }
    let d: Draft
    if (restore) {
      const snap = (s.previousVersions || []).find((x) => x.rev === restore)
      if (!snap) { toast('Ревизия для восстановления не найдена'); return }
      d = { ...draftFromService(snap), serviceName: s.name, publicPath: s.path, team: s.team, environment: s.env }
    } else d = draftFromService(s)
    setEdit({ id: s.id, previous: structuredClone(s), restore })
    setS(normalize(d))
    setView('create')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast(restore ? `Подготовлен черновик восстановления ${restore}. Активный сервис не изменён.` : 'Открыт черновик новой ревизии. Замените модель и запустите проверки.')
  }
  const cancelRedeploy = () => {
    if (!edit) return
    const id = edit.id
    setEdit(null); setS(fresh()); setCurrentId(id); setDetailTab('overview'); setView('detail')
    toast('Черновик отменён; активная версия не менялась.')
  }

  const deploy = () => {
    if (edit) {
      const p = edit.previous
      if (!acc.has(p.team, p.env === 'prod' ? 'exec' : 'write')) { toast('Недостаточно прав для редеплоя'); return }
      const errs = [!modelReady(S) && 'источник модели', !contractReady(S) && 'контракт', !testReady(S) && 'валидный тестовый JSON'].filter(Boolean)
      if (errs.length) { toast('Заполните перед обновлением: ' + errs.join(', ')); document.getElementById('s-launch')?.scrollIntoView({ behavior: 'smooth' }); return }
      setModal({ kind: 'redeploy' })
      return
    }
    if (!acc.has(S.team, S.environment === 'prod' ? 'exec' : 'write')) { toast('Недостаточно прав для публикации в выбранную команду или окружение.'); return }
    if (services.some((s) => s.path === S.publicPath)) { toast('Этот публичный путь уже занят. Выберите другое имя.'); return }
    const m = missing(S)
    if (m.length) { toast('Для публикации не хватает: ' + m.join(', ')); document.getElementById('s-launch')?.scrollIntoView({ behavior: 'smooth' }); return }
    setModal({ kind: 'deploy' })
  }
  const commitRedeploy = () => {
    if (!edit) return
    const s = services.find((x) => x.id === edit.id)
    if (!s) return
    const next = applyRevision(s, S, edit)
    setServices((x) => x.map((y) => (y.id === s.id ? next : y)))
    setEdit(null); setS(fresh()); setModal(null); setCurrentId(s.id); setDetailTab('history'); setView('detail')
    toast(`Демо-ревизия ${next.rev} применена. Публичный адрес не изменился.`)
  }
  const commitCreate = () => {
    const s = serviceFromDraft(S)
    setServices((x) => [s, ...x])
    setS(fresh()); setModal(null); setCurrentId(s.id); setDetailTab('overview'); setView('detail')
    try { localStorage.removeItem(DKEY) } catch { /* ignore */ }
    toast('Сервис добавлен в список (демо).')
  }
  const saveDraft = () => {
    try { localStorage.setItem(DKEY, JSON.stringify(S)); toast('Черновик сохранён локально в этом браузере.') } catch { downloadSpec(S, edit) }
  }
  const exportSpec = () => { downloadSpec(S, edit); toast('JSON-черновик скачан. Это не утверждённый API-контракт.') }
  const copy = (t: string) => navigator.clipboard?.writeText(t).then(() => toast('Скопировано'), () => toast('Не удалось скопировать'))

  /* ---------------- header ---------------- */
  const title = view === 'admin' ? 'Администрирование' : view === 'create' && edit ? 'Редеплой модели' : 'Вывод моделей в прод'
  const readTeams = acc.teams('read')
  const tabBtn = (on: boolean) => cx('inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors', on ? 'bg-ink-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]' : 'text-slate-400 hover:text-slate-200')

  return (
    <>
      <PageHeader title={title} subtitle="Inference-сервисы: публикация моделей, ревизии, тесты и мониторинг под одним стабильным адресом." icon={Rocket} />

      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-ink-900 p-1">
            <button className={tabBtn(view === 'list' || view === 'detail')} onClick={() => go('list')}><Layers className="h-4 w-4" /> Сервисы</button>
            <button className={tabBtn(view === 'create' && !edit)} onClick={openCreate}><Plus className="h-4 w-4" /> Создать сервис</button>
            {edit && <button className={tabBtn(view === 'create')} onClick={() => setView('create')}><RefreshCw className="h-4 w-4" /> Редеплой {edit.previous.name}</button>}
          </div>
          {acc.canAdmin() && (
            <div className="inline-flex rounded-xl border border-white/[0.06] bg-ink-900 p-1">
              <button className={tabBtn(view === 'admin')} onClick={() => go('admin')}><Settings className="h-4 w-4" /> Администрирование</button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!acc.global && <button className="btn-ghost" onClick={() => { const r = acc.recommended(); request(r.team, r.role) }}><ExternalLink className="h-4 w-4" /> Получить доступ</button>}
          <Chip tone={acc.global ? 'green' : readTeams.length ? 'violet' : 'slate'} className="h-9 px-3 text-[13px]">
            {acc.global ? 'Все команды · global admin' : readTeams.length ? `${teamLabel(readTeams[0])} · ${acc.roleFor(readTeams[0])}` : 'Нет назначенных ролей'}
          </Chip>
          <label className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-ink-900 py-1 pl-3 pr-1 text-xs text-slate-500">
            Демо-роль
            <select value={persona} onChange={(e) => changePersona(e.target.value as PersonaId)} className="rounded-md bg-ink-800 px-2 py-1 text-[13px] text-white outline-none">
              {(Object.keys(PERSONAS) as PersonaId[]).map((p) => <option key={p} value={p}>{PERSONAS[p].option}</option>)}
            </select>
          </label>
        </div>
      </div>

      {view === 'list' && ListView()}
      {view === 'detail' && current && DetailView({ s: current })}
      {view === 'admin' && AdminView()}
      {view === 'create' && (
        <ServiceForm S={S} set={set} edit={edit} acc={acc} onRequest={request} toast={toast} onDeploy={deploy} onSaveDraft={saveDraft} onExport={exportSpec} onCancelRedeploy={cancelRedeploy} />
      )}

      {modal?.kind === 'access' && <AccessModal key={modal.team + modal.role} team={modal.team} role={modal.role} acc={acc} onClose={() => setModal(null)} toast={toast} />}
      {(modal?.kind === 'deploy' || modal?.kind === 'redeploy') && (
        <DeployModal kind={modal.kind} S={S} edit={edit} onClose={() => { setModal(null); if (modal.kind === 'redeploy' && edit) toast('Публикация отменена. Сервис остался на ' + edit.previous.rev) }} onExport={exportSpec} onCommit={modal.kind === 'redeploy' ? commitRedeploy : commitCreate} />
      )}

      {toastText && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
          <div className="animate-fadeup rounded-xl border border-white/[0.1] bg-ink-800 px-4 py-2.5 text-sm text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)]">{toastText}</div>
        </div>
      )}
    </>
  )

  /* ================= views ================= */

  function ListView() {
    const visible = services.filter((s) => acc.has(s.team, 'read'))
    const rows = visible.filter((s) => (teamF === 'all' || s.team === teamF) && (statusF === 'all' || s.status === statusF) && (fmtF === 'all' || s.fmt === fmtF) && [s.name, s.model, s.engine, teamLabel(s.team)].join(' ').toLowerCase().includes(q.toLowerCase()))
    const canCreate = acc.teams('write').length > 0
    return (
      <>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Kicker>Inference services</Kicker>
            <h2 className="mt-1 text-2xl font-medium tracking-[-0.01em] text-white">Все inference-сервисы</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-400">Развёрнутые модели и ансамбли: статусы, производительность и история. Видны только команды, доступные по вашей роли.</p>
          </div>
          {canCreate ? <button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Создать сервис</button> : <AccessButton team={acc.recommended().team} role="write" label="Получить write для создания" onRequest={request} />}
        </div>
        {!visible.length ? <MissingPermission team={acc.recommended().team} role="read" reason="Нет доступа к моделям. Запросите read для просмотра или write для создания сервисов." onRequest={request} />
          : !canCreate && <MissingPermission team={readTeams[0] || acc.recommended().team} role="write" reason="Модели доступны только для просмотра. Чтобы создавать сервисы в Development, запросите write." onRequest={request} />}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Stat k="Доступно сервисов" v={visible.length} note="По текущим ролям SSO" />
          <Stat k="Работают стабильно" v={visible.filter((x) => x.status === 'healthy').length} note="Healthy · демо-статусы" />
          <Stat k="Production" v={visible.filter((x) => x.env === 'prod').length} note="Включая доступные только для чтения" />
          <Stat k="Команд с доступом" v={readTeams.length} note="read / write / exec / admin" />
        </div>
        <div className="card overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-white/[0.06] p-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени, файлу, движку…" className="input pl-9" />
            </div>
            <div className="grid grid-cols-3 gap-2 lg:flex">
              <select className="input lg:w-52" value={teamF} onChange={(e) => setTeamF(e.target.value)}><option value="all">Все доступные команды</option>{readTeams.map((t) => <option key={t} value={t}>{teamLabel(t)}</option>)}</select>
              <select className="input lg:w-40" value={statusF} onChange={(e) => setStatusF(e.target.value)}><option value="all">Любой статус</option><option value="healthy">Healthy</option><option value="warning">Degraded</option></select>
              <select className="input lg:w-44" value={fmtF} onChange={(e) => setFmtF(e.target.value)}><option value="all">Все форматы</option><option value="cbm">CatBoost · CBM</option><option value="onnx">ONNX</option><option value="ensemble">Ensemble</option></select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead><tr className="border-b border-white/[0.07] text-[13px] text-slate-400">{['Сервис / артефакт', 'Команда', 'Backend', 'Окружение', 'Статус', 'RPS / p99', 'Revision', ''].map((h) => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} onClick={() => openDetail(s.id)} className="cursor-pointer border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><FmtIcon fmt={s.fmt} /><div className="min-w-0"><div className="text-white">{s.name}</div><div className="truncate font-mono text-xs text-slate-500">{s.model}</div></div></div></td>
                    <td className="px-4 py-3"><div className="text-slate-300">{teamLabel(s.team)}</div><div className="font-mono text-xs text-slate-500">{s.team}</div></td>
                    <td className="px-4 py-3 text-slate-300">{s.engine}</td>
                    <td className="px-4 py-3"><EnvChip env={s.env} /></td>
                    <td className="px-4 py-3"><StatusChip s={s.status} /></td>
                    <td className="px-4 py-3"><div className="meter text-white">{s.rps}</div><div className="meter text-xs text-slate-500">{s.p99}</div></td>
                    <td className="meter px-4 py-3 text-slate-300">{s.rev}</td>
                    <td className="px-4 py-3 text-right"><span className="inline-flex items-center gap-1 text-[13px] text-slate-400">Открыть <ArrowRight className="h-3.5 w-3.5" /></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <div className="px-4 py-12 text-center text-sm text-slate-500"><div className="text-white">Сервисы не найдены</div>Проверьте фильтры или доступные роли.</div>}
          </div>
          <div className="flex flex-col gap-1 border-t border-white/[0.06] px-4 py-3 text-xs text-slate-500 sm:flex-row sm:justify-between"><span>Показано: <span className="meter">{rows.length}</span> из <span className="meter">{visible.length}</span></span><span>Данные демонстрационные · без подключения к Kubernetes</span></div>
        </div>
      </>
    )
  }

  function DetailView({ s }: { s: Service }) {
    const canWrite = acc.has(s.team, 'write'), canEnv = acc.has(s.team, s.env === 'prod' ? 'exec' : 'write')
    const envRole: Level = s.env === 'prod' ? 'exec' : 'write'
    const url = `${DOMAIN}/${s.path}`
    const card = 'card p-5'
    const native = s.engine.includes('Triton') ? '/v2/models/' + s.name.replace(/-/g, '_') + '/infer' : 'Нативный маршрут Go runtime'
    const FT = ({ rows, tone }: { rows: Service['features']; tone: 'violet' | 'green' }) => (
      <div className="overflow-x-auto rounded-xl border border-white/[0.07]"><table className="w-full text-left text-sm"><thead><tr className="border-b border-white/[0.07] text-xs text-slate-500"><th className="px-3 py-2 font-normal">Имя</th><th className="px-3 py-2 font-normal">Тип</th><th className="px-3 py-2 font-normal">Описание</th></tr></thead>
        <tbody>{rows.map((f) => <tr key={f[0]} className="border-b border-white/[0.04] last:border-0"><td className="px-3 py-2.5 font-mono text-white">{f[0]}</td><td className="px-3 py-2.5"><Chip tone={tone} className="font-mono">{f[1]}</Chip></td><td className="px-3 py-2.5 text-slate-400">{f[2]}</td></tr>)}</tbody></table></div>
    )
    const panels: Record<DetailTab, JSX.Element> = {
      overview: (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <div className={card}>
              <div className="flex items-center justify-between"><span className="font-medium text-white">Публичный endpoint</span><Chip tone="green">Stable URL</Chip></div>
              <div className="mt-4 rounded-xl border border-white/[0.07] bg-ink-950 p-3.5"><div className="text-xs text-slate-500">{s.env === 'prod' ? 'Production' : 'Development'} API</div><div className="mt-1 break-all font-mono text-[13px] text-violet-300">{url}</div><div className="mt-1.5 font-mono text-xs text-slate-500">{native}</div></div>
              <div className="mt-3 flex flex-wrap gap-2"><button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => copy(url)}><Copy className="h-3.5 w-3.5" /> Скопировать адрес</button><button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setDetailTab('model')}>Посмотреть контракт</button></div>
            </div>
            <div className={card}>
              <div className="font-medium text-white">Описание</div>
              <p className="mt-2 text-sm text-slate-400">{s.description}</p>
              <div className="my-4 border-t border-white/[0.06]" />
              <KV items={[['Тип', s.type], ['Задача', s.task], ['Backend', s.engine], ['Артефакт', <span className="font-mono">{s.model}</span>], ['Окружение', s.env === 'prod' ? 'Production' : 'Development'], ['Реплики', s.replicas]]} />
            </div>
          </div>
          <div className="space-y-4">
            <div className={card}>
              <div className="flex items-center justify-between"><span className="font-medium text-white">Статус</span><StatusChip s={s.status} /></div>
              <div className="my-4 border-t border-white/[0.06]" />
              <div className="grid grid-cols-2 gap-4">{[['RPS', s.rps], ['p99 latency', s.p99], ['CPU / GPU', s.cpu], ['RAM', s.mem]].map(([k, v]) => <div key={k}><div className="text-xs text-slate-500">{k}</div><div className="meter mt-1 text-white">{v}</div></div>)}</div>
            </div>
            <div className={card}>
              <div className="font-medium text-white">Последнее обновление</div>
              <p className="mt-2 text-sm text-slate-400">{s.last} · <span className="meter">{s.rev}</span></p>
              <div className="mt-3"><Chip tone={s.golden ? 'green' : 'amber'}>{s.golden ? 'Correctness: test passed' : 'Correctness: NOT_VERIFIED'}</Chip></div>
              <button className="btn-ghost mt-4" onClick={() => setDetailTab('tests')}>Все проверки <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      ),
      model: (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className={card}>
            <div className="font-medium text-white">Контракт модели и признаки</div>
            <p className="mb-4 mt-1 text-sm text-slate-500">Пример данных о модели. Инспекция реальных CBM/ONNX файлов в прототипе не выполняется.</p>
            <div className="mb-2 text-sm text-white">Входы / фичи</div><FT rows={s.features} tone="violet" />
            <div className="mb-2 mt-5 text-sm text-white">Выходы</div><FT rows={s.outputs} tone="green" />
          </div>
          <div className={card}>
            <div className="font-medium text-white">Метаданные модели</div>
            <div className="mt-4"><KV items={[['Название', s.name], ['Файл', <span className="font-mono">{s.model}</span>], ['Формат', s.fmt], ['Версия', s.rev], ['Команда', teamLabel(s.team)], ['Режим', s.type]]} /></div>
            <div className="my-4 border-t border-white/[0.06]" />
            {canEnv ? <button className="btn-primary" onClick={() => beginRedeploy(s)}><RefreshCw className="h-4 w-4" /> Заменить модель и создать ревизию</button> : <AccessButton team={s.team} role={envRole} label="Запросить доступ для обновления" onRequest={request} />}
            <Note className="mt-3">Артефакт, сигнатура и бизнес-семантика ответа должны иметь независимые версии в реальной реализации.</Note>
          </div>
        </div>
      ),
      tests: (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            {[['Smoke test', 'PASSED', 'Контракт API и готовность', 'text-emerald-300'], ['Correctness', s.golden ? 'PASSED' : 'NOT_VERIFIED', s.golden ? 'Golden samples выполнены' : 'Golden samples отсутствуют', s.golden ? 'text-emerald-300' : 'text-amber-300'], ['Benchmark', 'BASELINE', 'Иллюстративный результат', 'text-white']].map(([k, v, n, c]) => (
              <div key={k} className={card}><div className="text-[13px] text-slate-400">{k}</div><div className={cx('meter mt-2 text-xl font-medium', c)}>{v}</div><div className="mt-1 text-xs text-slate-500">{n}</div></div>
            ))}
          </div>
          <div className={card}>
            <div className="flex items-center justify-between"><span className="font-medium text-white">Последний отчёт нагрузочного тестирования</span><Chip>Демо-данные</Chip></div>
            <div className="my-4 grid grid-cols-3 gap-3">{[[s.rps, 'Throughput RPS'], [s.p99, 'p99 latency'], ['0,02%', 'Error rate']].map(([v, k]) => <div key={k} className="rounded-xl border border-white/[0.07] bg-ink-950/50 p-3.5"><div className="meter text-lg text-white">{v}</div><div className="text-xs text-slate-500">{k}</div></div>)}</div>
            <Note>Тестовые данные задаются до оптимизации; отсутствие golden samples не блокирует benchmark, но и не подтверждает корректность модели.</Note>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-ghost" onClick={() => copy(`Отчёт демонстрационный: ${s.name}`)}><Copy className="h-4 w-4" /> Скопировать краткий отчёт</button>
              {canWrite ? <button className="btn-ghost" onClick={() => toast('Запуск benchmark показан как действие, но к инфраструктуре не подключён.')}><RefreshCw className="h-4 w-4" /> Запустить тест (демо)</button> : <AccessButton team={s.team} role="write" label="Запросить write для теста" onRequest={request} />}
            </div>
          </div>
        </>
      ),
      monitoring: (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className={card}>
            <div className="flex items-center justify-between"><span className="font-medium text-white">Inference requests · RPS</span><Chip>Демо-метрики</Chip></div>
            <div className="mt-4 flex h-32 items-end gap-1">{[35, 44, 40, 66, 77, 58, 64, 87, 91, 79, 96, 76, 69, 98, 82, 70, 89, 77, 91, 83, 96, 72, 93, 82, 87, 75].map((h, i) => <span key={i} className="flex-1 rounded-t-sm bg-violet-500/70" style={{ height: `${h}%` }} />)}</div>
            <div className="mt-4 grid grid-cols-3 gap-3">{[[s.rps, 'RPS'], [s.p99, 'p99'], ['99,98%', 'Доступность']].map(([v, k]) => <div key={k} className="rounded-xl border border-white/[0.07] bg-ink-950/50 p-3.5"><div className="meter text-lg text-white">{v}</div><div className="text-xs text-slate-500">{k}</div></div>)}</div>
            <p className="mt-4 text-sm text-slate-500">В реальной платформе здесь будут Grafana / Prometheus и метрики конкретного движка. Числа в прототипе демонстрационные.</p>
          </div>
          <div className={card}>
            <div className="font-medium text-white">Runtime и ресурсы</div>
            <div className="mt-4"><KV items={[['Backend', s.engine], ['Replicas', s.replicas], ['CPU/GPU', s.cpu], ['Memory', s.mem], ['Окружение', s.env], ['Health', s.status]]} /></div>
          </div>
        </div>
      ),
      history: (
        <div className={card}>
          <div className="flex items-start justify-between gap-3"><div><div className="font-medium text-white">Ревизии и операции</div><p className="mt-1 text-sm text-slate-500">Новая публикация не меняет публичный адрес.</p></div><Chip tone="green">Текущая {s.rev}</Chip></div>
          <div className="mt-4">
            {(s.auditEvents || []).map((e, i) => (
              <div key={i} className="flex gap-3 border-b border-white/[0.05] py-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-emerald-500/40 text-emerald-300"><Check className="h-3 w-3" /></span><div><div className="text-sm text-white">{e.what} · <span className="meter">{e.rev}</span></div><div className="font-mono text-xs text-slate-500">{e.previousArtifact} → {e.artifact} · {e.at}</div></div></div>
            ))}
            <div className="flex gap-3 border-b border-white/[0.05] py-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-violet-500/50"><span className="h-2 w-2 rounded-full bg-violet-500" /></span><div><div className="text-sm text-white">Текущая версия · <span className="meter">{s.rev}</span></div><div className="text-xs text-slate-500"><span className="font-mono">{s.model}</span> · {s.last} · активна</div></div></div>
            {(s.previousVersions || []).map((v) => (
              <div key={v.rev} className="flex items-center justify-between gap-3 border-b border-white/[0.05] py-3 last:border-0">
                <div className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/15"><Diamond className="h-3 w-3 text-slate-500" /></span><div><div className="text-sm text-white"><span className="meter">{v.rev}</span> · <span className="font-mono">{v.model}</span></div><div className="text-xs text-slate-500">{v.engine} · предыдущая ревизия</div></div></div>
                {canEnv ? <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => beginRedeploy(s, v.rev)}><RotateCcw className="h-3.5 w-3.5" /> Восстановить</button> : <AccessButton small team={s.team} role={envRole} label="Нужен доступ" onRequest={request} />}
              </div>
            ))}
          </div>
          <Note className="mt-4"><span className="text-white">Как работает rollback:</span> выбираете старую версию, проверяете конфигурацию и выпускаете на её основе новую ревизию. Запущенные поды не меняются без проверок. Все действия в прототипе — симуляция.</Note>
        </div>
      ),
    }
    return (
      <>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => go('list')}><ArrowLeft className="h-3.5 w-3.5" /> К списку сервисов</button>
            <div className="mt-4"><Kicker>Service details / {teamLabel(s.team)}</Kicker></div>
            <h2 className="mt-1 text-2xl font-medium tracking-[-0.01em] text-white">{s.name}</h2>
            <div className="mt-1 text-sm text-slate-500">{s.type} · {s.engine} · <span className="meter">{s.rev}</span> · {s.env}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip s={s.status} />
            {canWrite && <button className="btn-ghost" onClick={() => { setEdit(null); setS(normalize({ ...fresh(), team: s.team, environment: 'dev', serviceName: s.name + '-copy', publicPath: '', format: s.fmt === 'cbm' ? 'cbm' : 'onnx', backend: s.fmt === 'cbm' ? 'go' : 'triton', kind: s.type === 'Ensemble' ? 'ensemble' : 'single', nameTouched: true })); setView('create'); toast('Создан черновик копии; модель и контракт нужно выбрать для нового сервиса.') }}><GitFork className="h-4 w-4" /> Клонировать</button>}
            {canEnv ? <button className="btn-primary" onClick={() => beginRedeploy(s)}><RefreshCw className="h-4 w-4" /> Изменить модель / Redeploy</button> : <AccessButton team={s.team} role={envRole} label={s.env === 'prod' ? 'Нужен exec для Redeploy' : 'Нужен write для Redeploy'} onRequest={request} />}
          </div>
        </div>
        {!canEnv && <MissingPermission team={s.team} role={envRole} reason={s.env === 'prod' ? 'Для изменения production-модели или rollback нужна роль exec. Просмотр доступен по read.' : 'Для редеплоя Development нужна роль write.'} onRequest={request} />}
        <div className="mb-4"><Tabs value={detailTab} onChange={setDetailTab} tabs={[{ id: 'overview', label: 'Обзор' }, { id: 'model', label: 'Модель' }, { id: 'tests', label: 'Тесты' }, { id: 'monitoring', label: 'Мониторинг' }, { id: 'history', label: 'История' }]} /></div>
        {panels[detailTab]}
      </>
    )
  }

  function AdminView() {
    const roles: Level[] = ['read', 'write', 'exec', 'admin']
    const ops: [string, Level][] = [['Просмотр моделей и результатов тестов', 'read'], ['Создание и запуск в Development', 'write'], ['Выполнение тестов в Dev', 'write'], ['Деплой, rollback и redeploy в Production', 'exec'], ['Управление настройками своей команды', 'admin']]
    const teams = acc.global ? Object.keys(TEAM_META) : acc.adminTeams()
    const count = services.filter((s) => teams.includes(s.team)).length
    const tabs: { id: AdminTab; label: string }[] = [{ id: 'overview', label: 'Обзор' }, { id: 'teams', label: 'Команды и права' }, { id: 'policies', label: 'Политики' }, ...(acc.global ? [{ id: 'infrastructure' as AdminTab, label: 'Инфраструктура' }] : [])]
    const tile = (mini: string, num: string | number | null, h: string, p: string) => (
      <div className="card p-5"><div className="text-xs text-slate-500">{mini}</div>{num !== null && <div className="meter mt-2 text-[28px] font-medium text-white">{num}</div>}<div className="mt-2 font-medium text-white">{h}</div><p className="mt-1 text-sm text-slate-500">{p}</p></div>
    )
    return (
      <>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><Kicker>Administration</Kicker><h2 className="mt-1 text-2xl font-medium tracking-[-0.01em] text-white">Администрирование</h2><p className="mt-1.5 max-w-2xl text-sm text-slate-400">Отдельная рабочая область для команд, ролей и правил сервинга. Не смешивается с созданием и эксплуатацией моделей.</p></div>
          <Chip tone={acc.global ? 'green' : 'violet'}>{acc.global ? 'Глобальный admin' : 'Администратор команды'}</Chip>
        </div>
        <div className="mb-4"><Tabs value={adminTab} onChange={setAdminTab} tabs={tabs} /></div>
        {adminTab === 'overview' && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {tile('Область управления', teams.length, 'Команды', acc.global ? 'Глобальный администратор видит все команды.' : 'Администрирование только своих команд.')}
              {tile('Сервисы в области', count, 'Inference-сервисы', 'Все сервисы команд, доступных администратору.')}
              {tile('Модель прав', 'SSO', 'Роли auto-deploy', 'Роли назначаются в SSO. Здесь видна эффективная область действия.')}
            </div>
            <div className="card mt-4 p-5"><div className="mb-2 font-medium text-white">Что вынесено из пользовательского интерфейса</div>
              <InfoRow k="Команды, права и роли" v={<Chip tone="violet">Администрирование</Chip>} />
              <InfoRow k="Ограничения по окружениям и деплою" v={<Chip>Политики</Chip>} />
              <InfoRow k="Справочники runtime, кластеры и квоты" v={<Chip>Global admin</Chip>} />
            </div>
          </>
        )}
        {adminTab === 'teams' && (
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="card p-5">
              <div className="font-medium text-white">Матрица ролей</div>
              <p className="mt-1 text-sm text-slate-500">Иерархия: read → write → exec → admin. Права всегда действуют в контексте команды.</p>
              <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-white/[0.07] text-xs text-slate-500"><th className="px-3 py-2 text-left font-normal">Операция</th>{roles.map((r) => <th key={r} className="px-3 py-2 font-normal">{r}</th>)}</tr></thead>
                <tbody>{ops.map(([l, min]) => <tr key={l} className="border-b border-white/[0.04] last:border-0"><td className="px-3 py-2.5 text-slate-300">{l}</td>{roles.map((r) => <td key={r} className="px-3 py-2.5 text-center">{ROLE_LEVEL[r] >= ROLE_LEVEL[min] ? <Check className="mx-auto h-4 w-4 text-emerald-300" /> : <span className="text-slate-600">—</span>}</td>)}</tr>)}</tbody></table></div>
              <Note className="mt-4">Роли назначаются и снимаются в SSO, а не здесь. В прототипе права нельзя изменить кнопкой на странице.</Note>
            </div>
            <div className="space-y-4">
              <div className="card p-5"><div className="font-medium text-white">Команды в вашей области</div>
                <div className="mt-3">{teams.map((t) => <div key={t} className="flex items-center justify-between border-b border-white/[0.05] py-2.5 last:border-0"><div><div className="text-sm text-white">{teamLabel(t)}</div><div className="font-mono text-xs text-slate-500">{t} · {services.filter((x) => x.team === t).length} сервисов</div></div><Chip tone="violet" className="font-mono">{acc.roleFor(t)}</Chip></div>)}</div>
              </div>
              <div className="card p-5"><div className="font-medium text-white">Claims токена · демонстрация</div><pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07] bg-ink-950 p-3.5 font-mono text-xs text-slate-300">{JSON.stringify({ resource_access: { 'auto-deploy': { roles: acc.roles } } }, null, 2)}</pre></div>
            </div>
          </div>
        )}
        {adminTab === 'policies' && (
          <div className="card p-5">
            <div className="font-medium text-white">Политики развёртывания по командам</div>
            <p className="mt-1 text-sm text-slate-500">Проектные настройки, а не сохранённые значения реального backend.</p>
            <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-white/[0.07] text-xs text-slate-500">{['Команда', 'Development', 'Production', 'Тестирование', 'Владелец'].map((h) => <th key={h} className="px-3 py-2 font-normal">{h}</th>)}</tr></thead>
              <tbody>{teams.map((t) => <tr key={t} className="border-b border-white/[0.04] last:border-0"><td className="px-3 py-2.5 text-white">{teamLabel(t)}</td><td className="px-3 py-2.5"><Chip tone="green" className="font-mono">write+</Chip></td><td className="px-3 py-2.5"><Chip tone="violet" className="font-mono">exec+</Chip></td><td className="px-3 py-2.5 text-slate-300">Smoke / benchmark</td><td className="px-3 py-2.5"><Chip className="font-mono">admin</Chip></td></tr>)}</tbody></table></div>
            <Note className="mt-4">Позже здесь появятся approvals, лимиты ресурсов, разрешённые backend и правила публикации. Редактирование политик в прототипе намеренно не имитируется.</Note>
          </div>
        )}
        {adminTab === 'infrastructure' && acc.global && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {tile('Serving runtimes', null, 'mircurius-online-inference', 'Go runtime · CBM и ONNX · подключаемый адаптер.')}
              {tile('Serving runtimes', null, 'NVIDIA Triton', 'ONNX и готовые ансамбли · подключаемый адаптер.')}
              {tile('Общая инфраструктура', null, 'Kubernetes / GPU / Gateway', 'Кластеры, профили ресурсов и маршрутизация — будущие системные настройки.')}
            </div>
            <Note className="mt-4">Системная инфраструктура доступна только глобальному admin. Администратор команды не управляет кластерами и каталогом runtime.</Note>
          </>
        )}
      </>
    )
  }
}

function AccessModal({ team, role, acc, onClose, toast }: { team: string; role: Level; acc: Access; onClose: () => void; toast: (t: string) => void }) {
  const sug = acc.recommended()
  const [t, setT] = useState(TEAM_META[team] ? team : sug.team)
  const [r, setR] = useState<Level>(ROLE_LEVEL[role] ? role : sug.role)
  const [reason, setReason] = useState(`Работа с inference-сервисами команды ${teamLabel(TEAM_META[team] ? team : sug.team)}`)
  const text = `Сервис: auto-deploy\nКоманда: ${t}\nЗапрашиваемая роль: ${t}:${r}\nОбоснование: ${reason || 'Нужен доступ к Auto Deploy'}`
  return (
    <Modal open onClose={onClose} title="Получить доступ к Auto Deploy">
      <div className="mb-3 flex flex-wrap gap-2"><Chip tone="violet"><KeyRound className="h-3 w-3" /> SSO · заявка на доступ</Chip><Chip>Демонстрационный экран</Chip></div>
      <p className="text-sm text-slate-400">Права выдаются через заявку на доступ и затем попадают в SSO. Здесь показан сценарий оформления: <span className="text-white">реальная заявка не создаётся.</span></p>
      <div className="mt-4 space-y-3">
        {[['Выберите команду и роль', <>Например, <code className="font-mono text-violet-300">ml-platform:write</code> для Development или <code className="font-mono text-violet-300">ml-platform:exec</code> для Production.</>], ['Отправьте заявку', <>Роль вида <code className="font-mono text-violet-300">&lt;team&gt;:&lt;access&gt;</code> в приложении <code className="font-mono text-violet-300">auto-deploy</code>.</>], ['После выдачи роли войдите снова', 'Новые права появятся после обновления SSO-сессии.']].map(([h, d], i) => (
          <div key={i} className="flex gap-3"><span className="meter grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/15 text-xs text-violet-300">{i + 1}</span><div><div className="text-sm text-white">{h}</div><div className="text-xs leading-5 text-slate-500">{d}</div></div></div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div><label className="label">Команда</label><select className="input" value={t} onChange={(e) => setT(e.target.value)}>{Object.keys(TEAM_META).map((x) => <option key={x} value={x}>{teamLabel(x)}</option>)}</select></div>
        <div><label className="label">Уровень доступа</label><select className="input" value={r} onChange={(e) => setR(e.target.value as Level)}>{(['read', 'write', 'exec', 'admin'] as Level[]).map((x) => <option key={x} value={x}>{x} · {LEVEL_LABEL[x]}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label">Обоснование</label><textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
      </div>
      <div className="mt-4 rounded-xl border border-white/[0.07] bg-ink-950 p-3.5 text-sm">Роль для заявки: <span className="font-mono text-violet-300">{t}:{r}</span><div className="mt-1 text-xs text-slate-500">Приложение: auto-deploy. Доступ проверяет backend, а не интерфейс.</div></div>
      <Note tone="amber" className="mt-3">Адрес формы заявки пока не задан. Скопируйте подготовленный текст; после настройки появится кнопка перехода.</Note>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Закрыть</button>
        <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(text).then(() => toast('Текст заявки скопирован.'), () => toast('Скопируйте данные роли из формы.'))}><Copy className="h-4 w-4" /> Скопировать заявку</button>
        <button className="btn-primary" disabled><ExternalLink className="h-4 w-4" /> Перейти к заявке</button>
      </div>
    </Modal>
  )
}

function DeployModal({ kind, S, edit, onClose, onExport, onCommit }: { kind: 'deploy' | 'redeploy'; S: Draft; edit: EditContext | null; onClose: () => void; onExport: () => void; onCommit: () => void }) {
  const p = edit?.previous
  const rev = p ? 'v' + (revNum(p.rev) + 1) : 'v1'
  const tail = S.mode === 'sla' ? 'Benchmark и проверка SLA' : S.mode === 'manual' ? 'Проверка ручной конфигурации' : 'Baseline benchmark / Auto-select'
  const steps = kind === 'redeploy'
    ? [`Фиксация неизменяемой ревизии ${rev}`, 'Проверка модели, формата и схемы API', 'Временный endpoint новой ревизии', 'Smoke и доступные golden samples', tail, 'Проверка совместимости публичного API', 'Readiness и подготовка переключения трафика']
    : ['Зафиксировать ревизию и контракты', 'Проверить артефакт и совместимость', 'Подготовить inference runtime', 'Прогнать smoke и доступные golden tests', tail, 'Опубликовать стабильный endpoint']
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (step > steps.length) return
    const id = window.setTimeout(() => setStep((x) => x + 1), 460)
    return () => clearTimeout(id)
  }, [step, steps.length])
  const done = step > steps.length
  const close = onClose
  return (
    <Modal open onClose={close} title={kind === 'redeploy' ? 'Новая ревизия модели' : 'Публикация inference-сервиса'}>
      <div className="mb-3 flex flex-wrap gap-2">
        {kind === 'redeploy' && p ? <><Chip tone="violet" className="meter">REDEPLOY · {p.rev} → {rev}</Chip><Chip tone={p.env === 'prod' ? 'amber' : 'slate'}>{p.env === 'prod' ? 'PRODUCTION' : 'DEVELOPMENT'}</Chip></> : <Chip tone="violet">Симуляция · нет подключения к Kubernetes</Chip>}
      </div>
      <p className="text-sm text-slate-400">
        {kind === 'redeploy' && p ? <><span className="font-mono text-white">{p.model}</span> → <span className="font-mono text-white">{S.artifact || S.registryId || S.sourceUri}</span>. Публичный адрес сохраняется: <span className="font-mono text-violet-300">{DOMAIN}/{p.path}</span>.</> : 'Так будет выглядеть процесс публикации. Реальные веса, правильность ответов, SLA и производительность не проверяются.'}
      </p>
      <div className="mt-4 space-y-2">
        {steps.map((x, i) => (
          <div key={x} className="flex items-center gap-3 text-sm">
            <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full border', i < step - 1 || done ? 'border-emerald-500/40 text-emerald-300' : i === step - 1 ? 'border-violet-500/50 text-violet-300' : 'border-white/15 text-slate-600')}>
              {i < step - 1 || done ? <Check className="h-3 w-3" /> : i === step - 1 ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="h-1 w-1 rounded-full bg-current" />}
            </span>
            <span className={i < step ? 'text-white' : 'text-slate-500'}>{x}</span>
          </div>
        ))}
      </div>
      <Note tone={done ? 'green' : 'slate'} className="mt-4">
        {!done ? (kind === 'redeploy' ? 'Демо-процесс выполняется — активный сервис не меняется.' : 'Демонстрационный процесс выполняется…')
          : kind === 'redeploy' ? <><span className="text-white">Демо-проверки завершены.</span> В реальном продукте решение зависит от результатов smoke, correctness и benchmark. Кнопка обновит только локальные демо-данные.</>
            : <><span className="text-white">Демонстрация завершена.</span> Адрес: <span className="font-mono text-violet-300">{publicUrl(S)}</span>. Реальных подов, benchmark и тестов нет.</>}
      </Note>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button className="btn-ghost" onClick={close}>{kind === 'redeploy' ? 'Отмена' : 'Закрыть'}</button>
        {kind === 'deploy' && <button className="btn-ghost" onClick={onExport}>Сохранить JSON</button>}
        {kind === 'redeploy'
          ? <button className="btn-primary" disabled={!done} onClick={onCommit}>Применить демо-ревизию {rev}</button>
          : <button className="btn-primary" disabled={!done || !validPath(S)} onClick={onCommit}>Добавить сервис в список</button>}
      </div>
    </Modal>
  )
}
