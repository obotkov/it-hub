import { ReactNode, useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, Diamond, Download, FileBox, Grid3x3, Layers, Lock, Play, Plus, RefreshCw, Save, Shapes, Target, Upload, Wand, X } from 'lucide-react'
import { cx } from '../../../components/ui'
import {
  Access, Backend, Draft, EditContext, Field as FieldT, FixtureKey, Level, SectionId,
  backendLabel, backendOptions, contractReady, fmtOf, missing, modeLabel, modelReady, nativeRoute, publicUrl, revNum,
  sampleFromSchema, suggestDescriptions, teamLabel, testReady, validPath, withDemo, withName, slug, DOMAIN,
} from './data'
import { AccessButton, Chip, Field, InfoRow, Kicker, MissingPermission, Note, OptionCard, RowTitle, Seg } from './ui'

type Props = {
  S: Draft
  set: (fn: (s: Draft) => Draft) => void
  edit: EditContext | null
  acc: Access
  onRequest: (team: string, role: Level) => void
  toast: (t: string) => void
  onDeploy: () => void
  onSaveDraft: () => void
  onExport: () => void
  onCancelRedeploy: () => void
}

const SECTIONS: [SectionId, string][] = [['model', 'Модель'], ['contract', 'Контракт'], ['engine', 'Движок'], ['test', 'Тестовые данные'], ['opt', 'Оптимизация'], ['launch', 'Публикация']]

function Section({ id, index, title, sub, open, onToggle, children }: { id: SectionId; index: string; title: string; sub: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <section id={`s-${id}`} className="card scroll-mt-20 overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <div className="meter grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-ink-800 text-[13px] text-violet-300">{index}</div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium text-white">{title}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{sub}</p>
        </div>
        <button type="button" onClick={onToggle} aria-label="Свернуть или раскрыть" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white">
          <ChevronDown className={cx('h-4 w-4 transition-transform', !open && '-rotate-90')} />
        </button>
      </div>
      {open && <div className="border-t border-white/[0.06] p-5">{children}</div>}
    </section>
  )
}

const DTYPES_IN = ['float32', 'float64', 'int32', 'int64', 'string', 'category', 'bool', 'tensor']
const DTYPES_OUT = ['float32', 'float64', 'int32', 'int64', 'string', 'bool', 'tensor']
const cellInput = 'w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-[13px] text-white outline-none placeholder:text-slate-600 hover:border-white/[0.08] focus:border-violet-500/50 focus:bg-ink-950'

function FieldTable({ rows, dtypes, onChange, onDelete, empty, descPh }: { rows: FieldT[]; dtypes: string[]; onChange: (i: number, k: keyof FieldT, v: string) => void; onDelete?: (i: number) => void; empty: string; descPh: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-white/[0.07] text-xs text-slate-500">
            <th className="px-3 py-2 font-normal">Название</th><th className="w-32 px-3 py-2 font-normal">Тип</th><th className="w-36 px-3 py-2 font-normal">Shape</th><th className="px-3 py-2 font-normal">Описание</th>{onDelete && <th className="w-10" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((f, i) => (
            <tr key={i} className="border-b border-white/[0.04] last:border-0">
              <td className="px-1.5 py-1"><input className={cx(cellInput, 'font-mono')} value={f.name} onChange={(e) => onChange(i, 'name', e.target.value)} aria-label="Имя" /></td>
              <td className="px-1.5 py-1"><select className={cellInput} value={f.dtype} onChange={(e) => onChange(i, 'dtype', e.target.value)}>{dtypes.map((d) => <option key={d}>{d}</option>)}</select></td>
              <td className="px-1.5 py-1"><input className={cx(cellInput, 'font-mono')} value={f.shape} onChange={(e) => onChange(i, 'shape', e.target.value)} aria-label="Shape" /></td>
              <td className="px-1.5 py-1"><input className={cellInput} value={f.desc} placeholder={descPh} onChange={(e) => onChange(i, 'desc', e.target.value)} aria-label="Описание" /></td>
              {onDelete && <td className="px-1.5"><button type="button" onClick={() => onDelete(i)} title="Удалить" className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-white/[0.06] hover:text-rose-300"><X className="h-3.5 w-3.5" /></button></td>}
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={5} className="px-4 py-5 text-sm text-slate-500">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

export function ServiceForm({ S, set, edit, acc, onRequest, toast, onDeploy, onSaveDraft, onExport, onCancelRedeploy }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState<SectionId>('model')
  const [stuck, setStuck] = useState(false)
  const lockUntil = useRef(0)
  // follow the section under the sticky step bar while the page scrolls
  useEffect(() => {
    const nav = navRef.current
    let scroller: HTMLElement | null = nav?.parentElement ?? null
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement
    const target: HTMLElement | Window = scroller ?? window
    let raf = 0
    const update = () => {
      raf = 0
      if (!nav) return
      const line = nav.getBoundingClientRect().bottom + 24
      let cur: SectionId = 'model'
      for (const [id] of SECTIONS) {
        const el = document.getElementById(`s-${id}`)
        if (el && el.getBoundingClientRect().top <= line) cur = id
      }
      const atEnd = scroller ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4 : window.innerHeight + window.scrollY >= document.body.scrollHeight - 4
      if (atEnd) cur = 'launch'
      if (Date.now() > lockUntil.current) setActive(cur)
      const top = scroller ? scroller.getBoundingClientRect().top : 0
      setStuck(nav.getBoundingClientRect().top <= top + 1)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    target.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { target.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [])
  useEffect(() => {
    // keep the active step visible inside the horizontally scrolling bar (mobile) without moving the page
    const nav = navRef.current
    const el = nav?.querySelector<HTMLElement>(`[data-step="${active}"]`)
    if (!nav || !el) return
    const l = el.offsetLeft - 16, r = el.offsetLeft + el.offsetWidth + 16
    if (l < nav.scrollLeft) nav.scrollTo({ left: l, behavior: 'smooth' })
    else if (r > nav.scrollLeft + nav.clientWidth) nav.scrollTo({ left: r - nav.clientWidth, behavior: 'smooth' })
  }, [active])
  const dataRef = useRef<HTMLInputElement>(null)
  const up = (patch: Partial<Draft>) => set((s) => ({ ...s, ...patch }))
  const toggle = (id: SectionId) => set((s) => ({ ...s, open: { ...s.open, [id]: !s.open[id] } }))
  const locked = !!edit

  const writeTeams = acc.teams('write')
  const canProd = acc.has(S.team, 'exec')
  const ready = [!!S.serviceName && validPath(S), modelReady(S), contractReady(S), testReady(S)]
  const miss = missing(S)
  const nextRev = edit ? revNum(edit.previous.rev) + 1 : 0

  const changeKind = (kind: Draft['kind']) =>
    set((s) => ({ ...s, kind, artifact: '', modelLoaded: false, fixture: false, features: [], outputs: [], signatureStatus: 'empty', format: kind === 'ensemble' ? 'onnx' : s.format, backend: kind === 'ensemble' ? 'triton' : s.format === 'cbm' ? 'go' : 'auto', testInput: '' }))
  const demo = (k: FixtureKey) => { set((s) => withDemo(s, k)); toast('Загружены демонстрационные метаданные. Файл модели не анализировался.') }
  const onFile = (file: File) => {
    set((s) => {
      let n: Draft = { ...s, artifact: file.name, modelLoaded: true, fixture: false, signatureStatus: 'not_inspected', features: [], outputs: [], testInput: '' }
      if (/\.cbm$/i.test(file.name)) n = { ...n, format: 'cbm', backend: 'go' }
      else if (/\.onnx$/i.test(file.name)) n = { ...n, format: 'onnx', backend: 'auto' }
      else if (/\.(zip|tar|tgz|gz)$/i.test(file.name)) n = { ...n, kind: 'ensemble', format: 'onnx', backend: 'triton' }
      return withName(n, file.name)
    })
    toast('Файл выбран. По расширению определён формат; сигнатуру определит инспектор модели на сервере.')
  }
  const setName = (v: string) => set((s) => ({ ...s, serviceName: v, nameTouched: true, publicPath: s.pathTouched ? s.publicPath : slug(v), engineModelName: s.engineNameTouched ? s.engineModelName : slug(v).replace(/-/g, '_') }))
  const editRow = (key: 'features' | 'outputs') => (i: number, k: keyof FieldT, v: string) => set((s) => ({ ...s, [key]: s[key].map((r, j) => (j === i ? { ...r, [k]: v } : r)) }))
  const setTeam = (team: string) => set((s) => ({ ...s, team, environment: acc.has(team, 'exec') ? s.environment : 'dev' }))
  const setEnv = (env: Draft['environment']) => {
    if (!acc.has(S.team, env === 'prod' ? 'exec' : 'write')) { toast('Недостаточно прав на выбранное окружение.'); return }
    up({ environment: env })
  }
  const inspect = () => {
    if (S.fixture) toast('Показана сигнатура демонстрационной модели.')
    else if (S.modelLoaded) toast('Прототип не разбирает бинарные файлы. В продукте здесь сработает инспектор модели; можно импортировать JSON manifest.')
    else toast('Сначала выберите модель.')
  }
  const descriptions = () => {
    if (!S.artifact && !S.features.length) { toast('Сначала выберите модель или заполните фичи.'); return }
    set(suggestDescriptions); toast('Описания предложены как черновик, а не как метаданные из файла.')
  }
  const sample = () => {
    const t = sampleFromSchema(S)
    if (!t) { toast('Сначала добавьте входы или заполните сигнатуру.'); return }
    up({ testInput: t }); toast('Создан синтетический пример по схеме — проверьте значения перед тестированием.')
  }
  const pathFixed = locked ? 'cursor-not-allowed opacity-60' : ''

  /* ---------- sections ---------- */
  const model = (
    <>
      {locked && (
        <Note className="mb-4"><Lock className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px" /><span className="text-white">Сервис, команда, окружение и public path зафиксированы.</span> Можно заменить модель, её конфигурацию, backend (если совместим), контракт и ресурсы. Смена адреса или типа сервиса — это новый сервис.</Note>
      )}
      <div className="mb-3 flex items-center justify-between gap-3"><RowTitle className="mb-0">Что разворачиваем?</RowTitle><Chip tone="green">Поддерживается в MVP</Chip></div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <OptionCard active={S.kind === 'single'} disabled={locked} onClick={() => changeKind('single')} icon={<Diamond className="h-4 w-4" />} title="Single Model" desc="Одна CBM или ONNX модель" />
        <OptionCard active={S.kind === 'ensemble'} disabled={locked} onClick={() => changeKind('ensemble')} icon={<Layers className="h-4 w-4" />} title="Готовый Ensemble" desc="Bundle с конфигурацией графа, без редактора" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Название сервиса" hint="Предложим автоматически по имени артефакта.">
          <input className={cx('input', pathFixed)} disabled={locked} value={S.serviceName} placeholder="Например, risk-detector" onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Путь на домене" hint={<span className="font-mono">{DOMAIN}/{'{путь}'}</span>}>
          <input className={cx('input font-mono', pathFixed)} disabled={locked} value={S.publicPath} placeholder="risk-detector" onChange={(e) => up({ publicPath: e.target.value, pathTouched: true })} />
        </Field>
      </div>

      <div className="mt-5 rounded-xl border border-white/[0.07] bg-ink-950/50 p-4">
        <RowTitle>Команда и окружение</RowTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Команда-владелец" hint="Доступные команды определяются ролями SSO.">
            <select className="input" disabled={locked || !writeTeams.length} value={S.team} onChange={(e) => setTeam(e.target.value)}>
              {(writeTeams.length ? writeTeams : [S.team]).map((t) => <option key={t} value={t}>{teamLabel(t)}</option>)}
            </select>
          </Field>
          <Field label="Куда развернуть" hint={canProd ? 'Production доступен по роли exec / admin.' : <span className="inline-flex flex-wrap items-center gap-2">Для Production нужна роль exec. <AccessButton small team={S.team} role="exec" label="Запросить exec" onRequest={onRequest} /></span>}>
            <select className="input" disabled={locked || !writeTeams.length} value={S.environment} onChange={(e) => setEnv(e.target.value as Draft['environment'])}>
              <option value="dev">Development · write+</option>
              <option value="prod" disabled={!canProd}>Production · exec+</option>
            </select>
          </Field>
        </div>
        {!writeTeams.length && <div className="mt-4"><MissingPermission team={S.team || acc.recommended().team} role="write" reason="У вашей роли нет прав на создание сервисов." onRequest={onRequest} /></div>}
      </div>

      <div className="my-5 border-t border-white/[0.06]" />
      <RowTitle>Источник модели</RowTitle>
      <Seg value={S.source} onChange={(v) => up({ source: v })} options={[['file', 'Файл / Bundle'], ['uri', 'URI'], ['clearml', 'ClearML'], ['mlflow', 'MLflow']]} />
      <div className="mt-3.5">
        {S.source === 'file' ? (
          <>
            <button type="button" onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFile(f) }}
              className="flex w-full items-center gap-4 rounded-xl border border-dashed border-white/15 px-5 py-5 text-left transition-colors hover:border-violet-500/50">
              <Upload className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={1.5} />
              <span><span className="block text-sm text-white">Перетащите файл или выберите с компьютера</span><span className="mt-0.5 block text-xs text-slate-500">{S.kind === 'single' ? 'Поддержка .cbm и .onnx' : 'Готовый bundle .zip, .tar, .tgz'} · в демо содержимое не анализируется</span></span>
            </button>
            <input ref={fileRef} type="file" hidden accept={S.kind === 'single' ? '.cbm,.onnx' : '.zip,.tar,.tgz,.gz'} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => demo('cbm')}>Пример .cbm</button>
              <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => demo('onnx')}>Пример .onnx</button>
              {S.kind === 'ensemble' && <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => demo('ensemble')}>Пример ансамбля</button>}
            </div>
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={S.source === 'uri' ? 'URI артефакта' : S.source === 'clearml' ? 'ClearML Model ID / версия' : 'MLflow Model / версия'}>
              <input className="input font-mono" value={S.source === 'uri' ? S.sourceUri : S.registryId} placeholder={S.source === 'uri' ? 's3://bucket/models/model.onnx' : S.source === 'clearml' ? 'model-id' : 'models:/my-model/1'}
                onChange={(e) => (S.source === 'uri' ? up({ sourceUri: e.target.value }) : up({ registryId: e.target.value }))} />
            </Field>
            <Note>Интеграция показана как предполагаемый UX. Прототип не обращается к Registry.</Note>
          </div>
        )}
      </div>
      {S.artifact && (
        <div className="mt-3.5 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-ink-950/50 p-3.5">
          <FileBox className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
          <div className="min-w-0 flex-1"><div className="truncate font-mono text-sm text-white">{S.artifact}</div><div className="text-xs text-slate-500">{S.fixture ? 'Демонстрационная модель: метаданные из встроенного примера' : 'Выбранный файл · инспекция выполнится на сервере'}</div></div>
          <Chip tone="violet">{S.fixture ? 'Demo metadata' : 'Формат определён'}</Chip>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip tone="green">Имя и путь: авто</Chip>
        <Chip tone={S.artifact ? 'green' : 'slate'}>Формат: {S.artifact ? fmtOf(S).toUpperCase() : 'после загрузки'}</Chip>
        <Chip tone={S.fixture ? 'violet' : 'amber'}>Сигнатура: {S.fixture ? 'пример' : 'нужна инспекция'}</Chip>
      </div>
    </>
  )

  const contract = (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-ink-950/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="text-sm font-medium text-white">Автозаполнение по модели</div><p className="mt-0.5 text-xs text-slate-500">Сигнатуру извлекает инспектор. Описания можно предложить, но их нужно подтвердить.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={inspect}><RefreshCw className="h-3.5 w-3.5" /> Заполнить схему</button><button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={descriptions}><Wand className="h-3.5 w-3.5" /> Предложить описания</button></div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Описание модели" hint="Заполните вручную или примите предложенный черновик.">
          <textarea className="input min-h-[96px]" value={S.description} placeholder="Для чего нужна модель, как используется…" onChange={(e) => up({ description: e.target.value })} />
        </Field>
        <Field label="Задача модели" hint="Задача не всегда однозначно определяется по весам.">
          <select className="input" value={S.task} onChange={(e) => up({ task: e.target.value })}>
            {[['unknown', 'Не определена'], ['classification', 'Classification'], ['regression', 'Regression'], ['ranking', 'Ranking'], ['transformation', 'Feature transformation'], ['pipeline', 'Ensemble / Pipeline']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </div>
      <div className="mb-2.5 mt-6 flex items-center justify-between gap-3"><RowTitle className="mb-0">Входные данные · фичи / тензоры</RowTitle><Chip tone={S.fixture ? 'violet' : 'amber'}>{S.fixture ? 'Демо-сигнатура' : S.signatureStatus === 'manual' ? 'Введено вручную' : 'Нужно проверить'}</Chip></div>
      <FieldTable rows={S.features} dtypes={DTYPES_IN} onChange={editRow('features')} onDelete={(i) => set((s) => ({ ...s, features: s.features.filter((_, j) => j !== i) }))} empty="После серверной инспекции здесь появится сигнатура. Поля можно добавить вручную." descPh="Описание…" />
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => set((s) => ({ ...s, signatureStatus: 'manual', features: [...s.features, { name: 'feature_' + (s.features.length + 1), dtype: 'float32', shape: 'scalar', desc: '', src: 'user' }] }))}><Plus className="h-3.5 w-3.5" /> Добавить фичу</button>
        <span className="text-xs text-slate-500">Типы и размеры подтверждаются для реального артефакта</span>
      </div>
      <RowTitle className="mt-6">Выход модели</RowTitle>
      <FieldTable rows={S.outputs} dtypes={DTYPES_OUT} onChange={editRow('outputs')} empty="Выходные тензоры / поля ещё не определены." descPh="Смысл выхода" />
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => set((s) => ({ ...s, signatureStatus: 'manual', outputs: [...s.outputs, { name: 'output_' + (s.outputs.length + 1), dtype: 'float32', shape: 'scalar', desc: '', src: 'user' }] }))}><Plus className="h-3.5 w-3.5" /> Добавить выход</button>
        <span className="text-xs text-slate-500">Нативный протокол движка сохраняется</span>
      </div>
      <Note className="mt-5"><span className="text-white">Важно:</span> имена, типы и shape часто извлекаются из ONNX; у CatBoost доступны имена и категории признаков, если они сохранены в артефакте. Бизнес-смысл выхода и описания не гарантируются.</Note>
    </>
  )

  const opts = backendOptions(S)
  const engine = (
    <>
      {S.kind === 'ensemble' && <Note className="mb-4">Для готового ансамбля backend определяется поддерживаемым bundle и его конфигурацией. Визуальный редактор графа — после MVP.</Note>}
      <RowTitle>Совместимые serving backend</RowTitle>
      <div className={cx('grid gap-2.5', opts.length === 3 ? 'lg:grid-cols-3' : 'sm:grid-cols-2')}>
        {opts.map((b: Backend) => (
          <OptionCard key={b} active={S.backend === b} onClick={() => up({ backend: S.format === 'cbm' && b === 'triton' ? 'go' : b })} icon={b === 'go' ? <Diamond className="h-4 w-4" /> : b === 'triton' ? <Grid3x3 className="h-4 w-4" /> : <Shapes className="h-4 w-4" />}
            title={backendLabel(b)} desc={b === 'go' ? 'Go runtime · CBM / ONNX' : b === 'triton' ? 'Triton · ONNX / готовый ensemble' : 'Сравнить совместимые движки на тестовой нагрузке'} />
        ))}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Внутреннее имя модели" hint="Используется в нативных запросах, может отличаться от публичного пути.">
          <input className="input font-mono" value={S.engineModelName} placeholder="example_model" onChange={(e) => up({ engineModelName: e.target.value, engineNameTouched: true })} />
        </Field>
        <Field label={S.backend === 'triton' ? 'Версия Triton' : 'Версия Go backend'}>
          <select className="input" value={S.backend === 'triton' ? S.tritonVersion : S.goVersion} onChange={(e) => (S.backend === 'triton' ? up({ tritonVersion: e.target.value }) : up({ goVersion: e.target.value }))}>
            <option value="approved">Рекомендованная (approved)</option><option value="pinned">Выбрать закреплённую версию</option>
          </select>
        </Field>
      </div>
      <Note className="mt-4"><span className="text-white">Правило MVP:</span> <code className="font-mono text-violet-300">.cbm → только Go runtime</code>; <code className="font-mono text-violet-300">.onnx → Go runtime / Triton / сравнение</code>. Фактическая совместимость проверяется при подготовке модели.</Note>
      <div className="mt-3 rounded-xl border border-dashed border-white/10 p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm text-white">Расширение после MVP</span><Chip>Later</Chip></div><p className="mt-1 text-xs text-slate-500">Custom Docker, Restricted Helm, дополнительные inference engines и смешанные графы.</p></div>
    </>
  )

  const test = (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-ink-950/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="text-sm font-medium text-white">Тестовые данные указываются до оптимизации</div><p className="mt-0.5 text-xs text-slate-500">Используются для smoke, baseline, SLA benchmark и подбора конфигурации. Golden samples необязательны.</p></div>
        <button type="button" className="btn-ghost shrink-0 px-2.5 py-1 text-xs" onClick={sample}><Wand className="h-3.5 w-3.5" /> Создать пример по схеме</button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Валидный пример запроса" hint={testReady(S) || !S.testInput ? 'Обязателен для benchmark. Синтетический пример нужно проверить.' : <span className="text-rose-300">JSON не разбирается — проверьте синтаксис.</span>}>
          <textarea className="input min-h-[140px] font-mono text-xs" value={S.testInput} placeholder='{"inputs": [...]}' onChange={(e) => up({ testInput: e.target.value })} />
        </Field>
        <Field label="Набор для нагрузки · JSONL / JSON / CSV" hint="Измерения на синтетических данных не подтверждают производительность на реальном трафике.">
          <button type="button" onClick={() => dataRef.current?.click()} className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 p-4 text-center transition-colors hover:border-violet-500/50">
            <Upload className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
            <span className="text-sm text-white">{S.datasetName || 'Загрузить тестовый dataset'}</span>
            <span className="text-xs text-slate-500">Необязательно; без него используется подтверждённый sample</span>
          </button>
          <input ref={dataRef} type="file" hidden accept=".jsonl,.json,.csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) { up({ datasetName: f.name }); toast('Тестовый набор выбран локально; содержимое не загружалось.') } e.target.value = '' }} />
        </Field>
      </div>
      <div className="my-5 border-t border-white/[0.06]" />
      <div className="flex items-center justify-between gap-4">
        <div><div className="text-sm font-medium text-white">Golden samples — проверка предсказаний</div><div className="mt-0.5 text-xs text-slate-500">Необязательно. Без них статус корректности будет <span className="font-mono text-amber-300">NOT_VERIFIED</span>.</div></div>
        <button type="button" role="switch" aria-checked={S.goldenEnabled} onClick={() => up({ goldenEnabled: !S.goldenEnabled })} className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors', S.goldenEnabled ? 'bg-violet-600' : 'bg-ink-600')}>
          <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform on-accent', S.goldenEnabled ? 'translate-x-5' : 'translate-x-0.5')} />
        </button>
      </div>
      {S.goldenEnabled && <Field label="Ожидаемый ответ или набор эталонов" className="mt-4"><textarea className="input min-h-[96px] font-mono text-xs" value={S.golden} placeholder='{"outputs": [...]}' onChange={(e) => up({ golden: e.target.value })} /></Field>}
      <details className="mt-5 rounded-xl border border-white/[0.07] [&_summary::-webkit-details-marker]:hidden">
        <summary className="cursor-pointer px-4 py-3 text-sm text-slate-300 hover:text-white">Расширенные параметры тестирования</summary>
        <div className="grid gap-4 border-t border-white/[0.06] p-4 sm:grid-cols-2">
          <Field label="Профиль нагрузки"><select className="input" value={S.testProfile} onChange={(e) => up({ testProfile: e.target.value })}><option value="steady">Steady (по умолчанию)</option><option value="burst">Burst</option><option value="soak">Soak</option></select></Field>
          <Note>Длительность, concurrency, генераторы нагрузки и пороги ошибок будут доступны после MVP или через согласованный профиль.</Note>
        </div>
      </details>
    </>
  )

  const num = (label: string, k: keyof Draft, ph: string) => (
    <Field label={label}><input type="number" min="0" step="any" className="input meter" value={String(S[k])} placeholder={ph} onChange={(e) => up({ [k]: e.target.value } as Partial<Draft>)} /></Field>
  )
  const opt = (
    <>
      <div className="grid gap-2.5 lg:grid-cols-3">
        <OptionCard active={S.mode === 'auto'} onClick={() => up({ mode: 'auto' })} icon={<Shapes className="h-4 w-4" />} title="Auto-select" desc="Baseline и подбор по цели" />
        <OptionCard active={S.mode === 'sla'} onClick={() => up({ mode: 'sla' })} icon={<Target className="h-4 w-4" />} title="Target SLA" desc="Поиск конфигурации под RPS / p99" />
        <OptionCard active={S.mode === 'manual'} onClick={() => up({ mode: 'manual' })} icon={<Grid3x3 className="h-4 w-4" />} title="Manual" desc="Ресурсы и параметры вручную" />
      </div>
      {S.mode === 'auto' && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Цель оптимизации">
            <select className="input" value={S.optGoal} onChange={(e) => up({ optGoal: e.target.value })}>
              <option value="balanced">Баланс latency / throughput / ресурсы</option><option value="latency">Минимальная задержка</option><option value="throughput">Максимальный throughput</option><option value="efficiency">Минимум ресурсов</option>
            </select>
          </Field>
          <Note tone="green"><span className="text-white">Что произойдёт:</span> платформа протестирует допустимые профили и предложит конфигурацию. Без SLA она не обещает конкретный p99 или RPS.</Note>
        </div>
      )}
      {S.mode === 'sla' && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">{num('Целевой RPS', 'rps', '1000')}{num('p99 latency, ms', 'p99', '40')}{num('Max errors, %', 'errorRate', '0.1')}</div>
          <Note className="mt-3">Поиск пытается найти конфигурацию под целевые ограничения. Если её нет — получите отчёт и варианты дальнейших действий.</Note>
        </>
      )}
      {S.mode === 'manual' && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {num('CPU, cores', 'cpu', '4')}{num('RAM, GiB', 'ram', '8')}{num('Replicas', 'replicas', '2')}{num('Workers / threads', 'workers', '4')}{num('Max batch size', 'batch', '1')}
            <Field label="Accelerator"><select className="input" value={S.gpu} onChange={(e) => up({ gpu: e.target.value })}><option value="none">CPU only</option><option value="gpu">NVIDIA GPU</option><option value="mig">NVIDIA MIG</option></select></Field>
          </div>
          <Note className="mt-3">Ручной выбор не отменяет проверку загрузки модели и smoke test. Параметры движка задаются в расширенном блоке.</Note>
        </>
      )}
      <details className="mt-5 rounded-xl border border-white/[0.07]">
        <summary className="cursor-pointer px-4 py-3 text-sm text-slate-300 hover:text-white">Дополнительные ограничения и настройки движка</summary>
        <div className="grid gap-4 border-t border-white/[0.06] p-4 sm:grid-cols-2">
          <Field label="Дополнительные args / параметры" hint="В прототипе это текстовый черновик, не реальные args."><textarea className="input min-h-[80px] font-mono text-xs" value={S.runtimeExtra} placeholder="Например, JSON со значениями backend" onChange={(e) => up({ runtimeExtra: e.target.value })} /></Field>
          <Note>В реальной платформе поля появятся динамически из возможностей выбранного движка и политики ресурсов.</Note>
        </div>
      </details>
    </>
  )

  const launch = (
    <>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {[['Команда / среда', `${teamLabel(S.team)} / ${S.environment === 'prod' ? 'Production' : 'Dev'}`], ['Модель', S.artifact || 'Не выбрана'], ['Backend', backendLabel(S.backend)], ['Режим', modeLabel(S.mode)]].map(([k, v]) => (
          <div key={k} className="min-w-0 rounded-xl border border-white/[0.07] bg-ink-950/50 p-3.5"><div className="text-xs text-slate-500">{k}</div><div className="mt-1 truncate text-sm text-white">{v}</div></div>
        ))}
      </div>
      <Note tone={miss.length ? 'amber' : 'green'} className="mt-4">
        {miss.length ? <><span className="text-white">Перед публикацией заполните:</span> {miss.join(', ')}.</> : <><span className="text-white">Готово к демонстрации.</span> Метаданные и тесты в прототипе не анализируются и не исполняются на сервере.</>}
      </Note>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" onClick={onExport}><Download className="h-4 w-4" /> Скачать конфигурацию</button>
        <button type="button" className="btn-primary" onClick={onDeploy}><Play className="h-4 w-4" /> {edit ? 'Проверить и обновить' : miss.length ? 'Проверить готовность' : 'Симулировать deploy'}</button>
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm text-white">После MVP</span><Chip>Roadmap</Chip></div><p className="mt-1 text-xs text-slate-500">Custom Docker / Helm, новые движки, визуальное построение ансамблей, мультирегиональные политики и гибкая маршрутизация трафика.</p></div>
    </>
  )

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>{edit ? 'Revision management' : 'Self-service inference'}</Kicker>
          <h2 className="mt-1 text-2xl font-medium tracking-[-0.01em] text-white">{edit ? `Редеплой · ${edit.previous.name}` : 'Новый inference-сервис'}</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{edit ? 'Подготовьте следующую ревизию: замените модель или настройте runtime. Текущая версия обслуживает запросы до подтверждения.' : 'Загрузите модель — остальное предложим автоматически. При необходимости раскройте параметры и настройте всё вручную.'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2"><Chip>UX-прототип · без backend</Chip><button type="button" className="btn-ghost" onClick={onSaveDraft}><Save className="h-4 w-4" /> Сохранить черновик</button></div>
      </div>

      <nav ref={navRef} aria-label="Шаги формы" className={cx('sticky top-0 z-20 -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 py-3 transition-[background-color,border-color] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8', stuck ? 'border-b border-white/[0.06] bg-ink-950/90 backdrop-blur' : 'border-b border-transparent')}>
        {SECTIONS.map(([id, label], i) => (
          <a key={id} data-step={id} href={`#s-${id}`} aria-current={active === id ? 'step' : undefined}
            onClick={(e) => { e.preventDefault(); if (!S.open[id]) toggle(id); lockUntil.current = Date.now() + 900; setActive(id); document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
            className={cx('shrink-0 rounded-lg border px-3 py-1.5 text-[13px] transition-colors', active === id ? 'border-violet-500/50 bg-violet-500/10 text-white' : 'border-white/[0.07] bg-ink-900 text-slate-400 hover:border-white/15 hover:text-white')}>
            <span className={cx('meter', active === id ? 'text-violet-300' : 'text-slate-500')}>0{i + 1}</span> · {label}
          </a>
        ))}
      </nav>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          {edit && (
            <div className="card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Kicker>Revision management · {edit.previous.env.toUpperCase()}</Kicker>
                  <h3 className="mt-1 text-lg font-medium text-white">{edit.previous.rev} → v{nextRev} {edit.restore && <span className="text-sm font-normal text-slate-500">· источник: {edit.restore}</span>}</h3>
                  <p className="mt-1 text-sm text-slate-400">Редактируется черновик. Публичный адрес <span className="font-mono text-white">{DOMAIN}/{edit.previous.path}</span> не изменится. Демо-сервис обновится только после подтверждения.{S.backend === 'auto' && ' При Auto-select в демо нет реального benchmark: backend условно наследуется от текущей версии.'}</p>
                </div>
                <Chip tone="violet">Черновик новой ревизии</Chip>
              </div>
              <div className="mt-4 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-xl border border-white/[0.07] bg-ink-950/50 p-3.5"><div className="text-xs text-slate-500">Сейчас в сервисе</div><div className="mt-1 truncate font-mono text-sm text-white">{edit.previous.model}</div><div className="mt-0.5 text-xs text-slate-500">{edit.previous.engine} · {edit.previous.rev}</div></div>
                <ArrowRight className="mx-auto h-4 w-4 text-slate-500" />
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/[0.06] p-3.5"><div className="text-xs text-violet-300">Новая ревизия</div><div className="mt-1 truncate font-mono text-sm text-white">{S.artifact || S.registryId || S.sourceUri || 'Выберите модель'}</div><div className="mt-0.5 text-xs text-slate-500">{backendLabel(S.backend)} · v{nextRev}</div></div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-slate-500">Для замены нажмите «Пример .cbm» / «Пример .onnx» или загрузите свой файл.</span>
                <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={onCancelRedeploy}>Отменить изменения</button>
              </div>
            </div>
          )}
          <Section id="model" index="01" title={edit ? 'Обновление модели и адрес' : 'Модель и адрес'} sub={edit ? 'Смена артефакта; публичный адрес сервиса сохраняется' : 'Создание сервиса, загрузка артефакта и будущий публичный путь'} open={S.open.model} onToggle={() => toggle('model')}>{model}</Section>
          <Section id="contract" index="02" title="Описание и API-контракт" sub="Назначение модели, фичи, входы и выходы, автозаполнение" open={S.open.contract} onToggle={() => toggle('contract')}>{contract}</Section>
          <Section id="engine" index="03" title="Inference backend" sub="Совместимые движки уже отфильтрованы по формату модели" open={S.open.engine} onToggle={() => toggle('engine')}>{engine}</Section>
          <Section id="test" index="04" title="Тестовые данные и проверки" sub="Образцы запросов, нагрузка и golden samples — до benchmark" open={S.open.test} onToggle={() => toggle('test')}>{test}</Section>
          <Section id="opt" index="05" title="Производительность и параметры" sub="Три режима: Auto-select, SLA или Manual" open={S.open.opt} onToggle={() => toggle('opt')}>{opt}</Section>
          <Section id="launch" index="06" title="Проверка и публикация" sub="Всё собрано на одной странице; новая конфигурация создаёт revision" open={S.open.launch} onToggle={() => toggle('launch')}>{launch}</Section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <div className="card p-5">
            <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-white">{edit ? 'Предпросмотр новой revision' : 'Предпросмотр сервиса'}</span><Chip tone={edit ? 'violet' : 'green'}>{edit ? 'Draft' : 'Live preview'}</Chip></div>
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-ink-950 p-3.5">
              <div className="text-xs text-slate-500">Публичный адрес</div>
              <div className="mt-1 break-all font-mono text-[13px] text-violet-300">{publicUrl(S)}</div>
              <div className="mt-1.5 break-all font-mono text-xs text-slate-500">{nativeRoute(S)}</div>
            </div>
            <div className="mt-3">
              <InfoRow k="Команда / среда" v={`${teamLabel(S.team)} / ${S.environment === 'prod' ? 'Production' : 'Development'}`} />
              <InfoRow k="Тип" v={S.kind === 'single' ? 'Single Model' : 'Готовый Ensemble'} />
              <InfoRow k="Артефакт" v={<span className="font-mono">{S.artifact || '—'}</span>} />
              <InfoRow k="Формат" v={fmtOf(S).toUpperCase()} />
              <InfoRow k="Backend" v={backendLabel(S.backend)} />
              <InfoRow k="Engine model" v={<span className="font-mono">{S.engineModelName || '—'}</span>} />
              <InfoRow k="Оптимизация" v={S.mode === 'auto' ? 'Auto-select / baseline' : modeLabel(S.mode)} />
              <InfoRow k="Корректность" v={<Chip tone={S.goldenEnabled ? 'violet' : 'amber'}>{S.goldenEnabled ? 'Запланирована' : 'NOT_VERIFIED'}</Chip>} />
            </div>
            <p className="mt-3 text-xs text-slate-500">Один адрес для клиента. Нативный путь определяется backend и настройкой gateway.</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-white">Готовность к запуску</span><Chip tone={ready.every(Boolean) ? 'green' : 'amber'}><span className="meter">{ready.filter(Boolean).length}/{ready.length}</span></Chip></div>
            <div className="mt-3 space-y-1.5">
              {(['Название и путь', 'Источник модели', 'Технический контракт', 'Валидный тестовый input'] as const).map((t, i) => (
                <div key={t} className="flex items-center gap-2.5 text-[13px]">
                  <span className={cx('grid h-5 w-5 place-items-center rounded-full border', ready[i] ? 'border-emerald-500/40 text-emerald-300' : 'border-white/15 text-slate-600')}>{ready[i] ? <Check className="h-3 w-3" /> : <span className="h-1 w-1 rounded-full bg-current" />}</span>
                  <span className={ready[i] ? 'text-white' : 'text-slate-400'}>{t}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-white/[0.06] pt-3 text-xs leading-5 text-slate-500">
              Права: <span className="meter text-slate-300">{acc.roleFor(S.team) || 'none'}</span> · {acc.has(S.team, S.environment === 'prod' ? 'exec' : 'write') ? 'публикация разрешена' : <span className="inline-flex flex-wrap items-center gap-2">нужен доступ <AccessButton small team={S.team} role={S.environment === 'prod' ? 'exec' : 'write'} label="Оформить заявку" onRequest={onRequest} /></span>}. Тесты в демо не запускаются.
            </div>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-white/[0.06] bg-ink-950/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500"><Chip tone="green">MVP</Chip><span className="hidden sm:inline">Одна страница · раскрываемые настройки · автоматические подсказки</span></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={onExport}><Download className="h-4 w-4" /> Скачать JSON</button>
            <button type="button" className="btn-primary" onClick={onDeploy}>{edit ? <><RefreshCw className="h-4 w-4" /> Проверить и обновить сервис</> : <><Play className="h-4 w-4" /> Проверить и развернуть</>}</button>
          </div>
        </div>
      </div>
    </>
  )
}
