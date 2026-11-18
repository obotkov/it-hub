import { FormEvent, useEffect, useRef, useState } from 'react'
import {
  Bot, Check, ChevronDown, ChevronRight, Code2, Database, FileText, GitBranch, Globe, Library, Loader2, Paperclip,
  Plug, Puzzle, Send, Settings2, SlidersHorizontal, Sparkles, Terminal, Trash2, Wrench, X, Zap, BookOpen, Layers,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge, Toggle, cx } from '../../components/ui'
import { models } from './ai'

/* ------------------------------ data ------------------------------ */

type Source = { id: string; name: string; desc: string; icon: LucideIcon; tools?: string[] }

const ragBases: Source[] = [
  { id: 'wiki', name: 'Внутренняя wiki', desc: '1 240 документов', icon: BookOpen },
  { id: 'contracts', name: 'Договоры 2026', desc: '312 документов', icon: FileText },
  { id: 'faq', name: 'Техподдержка FAQ', desc: '86 документов', icon: Library },
]

const mcpServers: Source[] = [
  { id: 'github', name: 'GitHub', desc: 'репозитории, issues, PR', icon: GitBranch, tools: ['search_issues', 'get_file', 'create_pr'] },
  { id: 'postgres', name: 'PostgreSQL', desc: 'prod-postgres (read-only)', icon: Database, tools: ['list_tables', 'query'] },
  { id: 'wildmetrics', name: 'Wildmetrics', desc: 'отчёты и события', icon: Zap, tools: ['get_report', 'get_funnel'] },
  { id: 'jira', name: 'Jira', desc: 'задачи и спринты', icon: Puzzle, tools: ['search', 'create_issue'] },
]

const skillsList: Source[] = [
  { id: 'sql', name: 'SQL-аналитик', desc: 'пишет запросы под схему', icon: Code2 },
  { id: 'contracts-skill', name: 'Анализ договоров', desc: 'риски и условия', icon: FileText },
  { id: 'xlsx', name: 'Excel-мастер', desc: 'таблицы и графики', icon: Layers },
]

const builtins: Source[] = [
  { id: 'web', name: 'Веб-поиск', desc: 'свежие данные из интернета', icon: Globe },
  { id: 'code', name: 'Code Interpreter', desc: 'Python в песочнице', icon: Terminal },
]

const presets = [
  { name: 'Аналитик данных', prompt: 'Ты — аналитик данных. Используй SQL и отчёты Wildmetrics, приводи цифры и выводы.', on: ['postgres', 'wildmetrics', 'sql', 'code'] },
  { name: 'Юрист', prompt: 'Ты — юрист компании. Отвечай со ссылками на пункты договоров.', on: ['contracts', 'contracts-skill'] },
  { name: 'Разработчик', prompt: 'Ты — senior-разработчик. Ищи ответы в коде и issues, предлагай патчи.', on: ['github', 'jira', 'web'] },
]

/* ------------------------------ types ------------------------------ */

type Step = { tool: string; server: string; icon: LucideIcon; args: string; result: string; ms: number; done: boolean }
type Cite = { n: number; title: string; where: string }
type Msg = { role: 'user' | 'assistant'; text: string; files?: string[]; steps?: Step[]; cites?: Cite[]; tokens?: number }

/* ------------------------------ page ------------------------------ */

export function ProChat() {
  const [model, setModel] = useState(models[0])
  const [pick, setPick] = useState(false)
  const [panel, setPanel] = useState<'context' | 'params'>('context')
  const [showPanel, setShowPanel] = useState(true)
  const [on, setOn] = useState<Record<string, boolean>>({ wiki: true, github: true, wildmetrics: true, web: true, sql: true })
  const [system, setSystem] = useState('Ты — ассистент компании. Используй подключённые источники и указывай ссылки на них.')
  const [temp, setTemp] = useState(0.4)
  const [maxTok, setMaxTok] = useState(4096)
  const [effort, setEffort] = useState<'low' | 'medium' | 'high'>('medium')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [usage, setUsage] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const toggle = (id: string, v: boolean) => setOn((o) => ({ ...o, [id]: v }))
  const activeCount = Object.values(on).filter(Boolean).length
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const plan = (q: string): { steps: Step[]; cites: Cite[] } => {
    const steps: Step[] = []
    const cites: Cite[] = []
    const short = q.length > 40 ? q.slice(0, 40) + '…' : q
    ragBases.filter((b) => on[b.id]).forEach((b) => {
      steps.push({ tool: 'rag.search', server: b.name, icon: Library, args: `{ "query": "${short}", "top_k": 5 }`, result: '5 фрагментов, релевантность 0.81–0.93', ms: 180 + Math.round(Math.random() * 200), done: false })
      cites.push({ n: cites.length + 1, title: `${b.name}: раздел ${2 + cites.length}`, where: `стр. ${3 + cites.length * 4}` })
    })
    mcpServers.filter((s) => on[s.id]).forEach((s) => {
      const tool = s.tools![0]
      const res: Record<string, string> = {
        github: '3 issues: #412, #398, #377',
        postgres: '12 таблиц, схема public',
        wildmetrics: 'визиты 48 213 (+12.4%), CR 3.2%',
        jira: '7 задач в текущем спринте',
      }
      steps.push({ tool: `${s.id}.${tool}`, server: `MCP · ${s.name}`, icon: Plug, args: `{ "q": "${short}" }`, result: res[s.id], ms: 300 + Math.round(Math.random() * 400), done: false })
      cites.push({ n: cites.length + 1, title: `${s.name} · ${tool}`, where: 'MCP' })
    })
    if (on.web) {
      steps.push({ tool: 'web.search', server: 'Встроенный', icon: Globe, args: `{ "q": "${short}" }`, result: '8 результатов, 3 источника использовано', ms: 650, done: false })
      cites.push({ n: cites.length + 1, title: 'Веб-источник', where: 'example.com' })
    }
    if (on.code) steps.push({ tool: 'python.run', server: 'Code Interpreter', icon: Terminal, args: 'df.groupby("day").sum().plot()', result: 'OK · chart.png', ms: 900, done: false })
    return { steps, cites }
  }

  const send = (e?: FormEvent) => {
    e?.preventDefault()
    if (!text.trim() || busy) return
    const q = text.trim()
    const { steps, cites } = plan(q)
    const f = files
    setMsgs((m) => [...m, { role: 'user', text: q, files: f }, { role: 'assistant', text: '', steps: steps.map((s) => ({ ...s })), cites: [] }])
    setText('')
    setFiles([])
    setBusy(true)

    const patchLast = (fn: (m: Msg) => Msg) =>
      setMsgs((m) => {
        const c = [...m]
        c[c.length - 1] = fn(c[c.length - 1])
        return c
      })

    let t = 300
    steps.forEach((s, i) => {
      t += s.ms
      later(() => patchLast((m) => ({ ...m, steps: m.steps!.map((x, j) => (j === i ? { ...x, done: true } : x)) })), t)
    })

    const used = [
      ...ragBases.filter((b) => on[b.id]).map((b) => `базу знаний «${b.name}»`),
      ...mcpServers.filter((s) => on[s.id]).map((s) => s.name),
      ...(on.web ? ['веб-поиск'] : []),
    ]
    const skills = skillsList.filter((s) => on[s.id]).map((s) => s.name)
    const answer =
      (steps.length ? `Я выполнил ${steps.length} ${steps.length === 1 ? 'вызов инструмента' : 'вызова инструментов'}${used.length ? ` (${used.join(', ')})` : ''}.\n\n` : 'Инструменты не подключены — отвечаю только знаниями модели.\n\n') +
      (f.length ? `Учёл прикреплённые файлы: ${f.join(', ')}.\n\n` : '') +
      `**Краткий ответ** на «${q.length > 60 ? q.slice(0, 60) + '…' : q}»:\n` +
      cites.map((c) => `• вывод на основе источника [${c.n}]`).join('\n') +
      (cites.length ? '\n\n' : '') +
      (skills.length ? `Применены навыки: ${skills.join(', ')}.\n` : '') +
      `Модель: ${model.name} · temperature ${temp} · effort ${effort}.\n\n_Демо-режим: вызовы инструментов и ответ сымитированы, интерфейс соответствует рабочему._`

    later(() => {
      let i = 0
      const tick = () => {
        i += 5
        patchLast((m) => ({ ...m, text: answer.slice(0, i) }))
        if (i < answer.length) later(tick, 14)
        else {
          const tokens = 800 + steps.length * 1200 + Math.round(Math.random() * 500)
          patchLast((m) => ({ ...m, cites, tokens }))
          setUsage((u) => u + tokens)
          setBusy(false)
        }
      }
      tick()
    }, t + 250)
  }

  const applyPreset = (p: (typeof presets)[number]) => {
    setSystem(p.prompt)
    const next: Record<string, boolean> = {}
    p.on.forEach((id) => (next[id] = true))
    setOn(next)
  }

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] sm:-m-6 lg:-m-8">
      {/* chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.05] px-4 py-3">
          <div className="relative">
            <button onClick={() => setPick(!pick)} className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-white hover:bg-white/5">
              <Sparkles className="h-4 w-4 text-violet-400" /> {model.name} <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
            {pick && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setPick(false)} />
                <div className="absolute z-40 mt-1 w-80 animate-fadeup rounded-2xl border border-white/10 bg-ink-850 p-2 shadow-2xl">
                  {models.map((m) => (
                    <button key={m.id} onClick={() => { setModel(m); setPick(false) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/5">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-white">{m.name}</div>
                        <div className="text-xs text-slate-500">{m.vendor} · контекст {m.ctx}</div>
                      </div>
                      {m.tag && <Badge tone={m.tag === 'Open' ? 'cyan' : 'violet'}>{m.tag}</Badge>}
                      <Check className={cx('h-4 w-4 shrink-0 text-violet-400', m.id !== model.id && 'invisible')} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <Badge tone="violet">PRO</Badge>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 sm:inline">{usage.toLocaleString('ru-RU')} токенов · ≈ {(usage * 0.0012).toFixed(2)} ₽</span>
            {msgs.length > 0 && (
              <button onClick={() => setMsgs([])} title="Очистить" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><Trash2 className="h-4 w-4" /></button>
            )}
            <button onClick={() => setShowPanel(!showPanel)} className={cx('flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm', showPanel ? 'border-violet-500/40 bg-violet-500/10 text-violet-200' : 'border-white/10 text-slate-300 hover:bg-white/5')}>
              <SlidersHorizontal className="h-4 w-4" /> Инструменты <span className="rounded-md bg-white/10 px-1.5 text-xs">{activeCount}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {msgs.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              <div className="on-accent grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-900/40">
                <Wrench className="h-7 w-7 text-white" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">Pro чат</h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">Модель сама вызывает подключённые инструменты: ищет в базах знаний (RAG), обращается к MCP-серверам, гуглит и запускает код — и показывает каждый шаг.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {presets.map((p) => (
                  <button key={p.name} onClick={() => applyPreset(p)} className="btn-ghost text-xs">{p.name}</button>
                ))}
              </div>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                {['Почему упала конверсия на этой неделе?', 'Найди в wiki регламент релизов', 'Какие открытые баги по оплате в GitHub?', 'Посчитай выручку по дням из БД и построй график'].map((s) => (
                  <button key={s} onClick={() => setText(s)} className="card p-3 text-left text-sm text-slate-300 transition hover:border-white/15">{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {msgs.map((m, i) => (m.role === 'user' ? <UserMsg key={i} m={m} /> : <AssistantMsg key={i} m={m} />))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <form onSubmit={send} className="mx-auto w-full max-w-3xl px-4 pb-4">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {[...ragBases, ...mcpServers, ...skillsList, ...builtins].filter((s) => on[s.id]).map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] py-0.5 pl-2 pr-1 text-[11px] text-slate-300">
                <s.icon className="h-3 w-3 text-violet-300" /> {s.name}
                <button type="button" onClick={() => toggle(s.id, false)} className="rounded-full p-0.5 hover:bg-white/10"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-ink-850 p-2 focus-within:border-violet-500/50">
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2">
                {files.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-300">
                    <FileText className="h-3.5 w-3.5 text-violet-300" /> {f}
                    <button type="button" onClick={() => setFiles((x) => x.filter((y) => y !== f))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              rows={2}
              placeholder="Спросите что-нибудь — модель сама решит, какие инструменты вызвать…"
              className="w-full resize-none bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-slate-500"
            />
            <div className="flex items-center justify-between">
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => setFiles((x) => [...x, ...Array.from(e.target.files ?? []).map((f) => f.name)])} />
              <div className="flex gap-1">
                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white"><Paperclip className="h-4 w-4" /> Файл</button>
                <button type="button" onClick={() => { setShowPanel(true); setPanel('context') }} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white"><Plug className="h-4 w-4" /> MCP / RAG</button>
              </div>
              <button disabled={!text.trim() || busy} className="on-accent grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-40">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* tools panel */}
      {showPanel && (
        <aside className="hidden w-80 shrink-0 flex-col border-l border-white/[0.05] bg-ink-900/40 md:flex">
          <div className="flex gap-1 border-b border-white/[0.05] p-2">
            {([['context', 'Инструменты', Plug], ['params', 'Параметры', Settings2]] as const).map(([id, l, I]) => (
              <button key={id} onClick={() => setPanel(id)} className={cx('flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm', panel === id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white')}>
                <I className="h-4 w-4" /> {l}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            {panel === 'context' ? (
              <>
                <Group title="RAG · базы знаний" items={ragBases} on={on} toggle={toggle} />
                <Group title="MCP-серверы" items={mcpServers} on={on} toggle={toggle} />
                <Group title="Навыки" items={skillsList} on={on} toggle={toggle} />
                <Group title="Встроенные" items={builtins} on={on} toggle={toggle} />
              </>
            ) : (
              <>
                <div>
                  <label className="label">Пресет</label>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((p) => <button key={p.name} onClick={() => applyPreset(p)} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/5">{p.name}</button>)}
                  </div>
                </div>
                <div>
                  <label className="label">Системный промпт</label>
                  <textarea className="input h-32 resize-none text-xs" value={system} onChange={(e) => setSystem(e.target.value)} />
                </div>
                <Slider label="Temperature" value={temp} min={0} max={1} step={0.1} onChange={setTemp} />
                <Slider label="Max tokens" value={maxTok} min={256} max={32768} step={256} onChange={setMaxTok} />
                <div>
                  <label className="label">Глубина рассуждений</label>
                  <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.06] bg-ink-900 p-1">
                    {(['low', 'medium', 'high'] as const).map((e) => (
                      <button key={e} onClick={() => setEffort(e)} className={cx('rounded-lg py-1.5 text-xs', effort === e ? 'bg-white/10 text-white' : 'text-slate-400')}>{e}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-white/[0.06] p-3 text-sm">
                  <label className="flex items-center justify-between gap-3 text-slate-300">Подтверждать вызовы инструментов <Toggle on={!!on.confirm} onChange={(v) => toggle('confirm', v)} /></label>
                </div>
              </>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}

/* ------------------------------ pieces ------------------------------ */

function Group({ title, items, on, toggle }: { title: string; items: Source[]; on: Record<string, boolean>; toggle: (id: string, v: boolean) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</span>
        <span className="text-[11px] text-slate-500">{items.filter((i) => on[i.id]).length}/{items.length}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((s) => (
          <div key={s.id} className={cx('flex items-center gap-3 rounded-xl border p-2.5 transition', on[s.id] ? 'border-violet-500/30 bg-violet-500/[0.06]' : 'border-white/[0.06] bg-ink-850')}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5"><s.icon className="h-4 w-4 text-slate-300" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-white">{s.name}</span>
              <span className="block truncate text-[11px] text-slate-500">{s.tools ? `${s.tools.length} инструмента · ` : ''}{s.desc}</span>
            </span>
            <Toggle on={!!on[s.id]} onChange={(v) => toggle(s.id, v)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between"><span className="label mb-0">{label}</span><span className="font-mono text-xs text-slate-300">{value}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-violet-500" />
    </div>
  )
}

function UserMsg({ m }: { m: Msg }) {
  return (
    <div className="flex justify-end">
      <div className="on-accent max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-violet-600 px-4 py-3 text-sm text-white">
        {m.files && m.files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {m.files.map((f) => <span key={f} className="inline-flex items-center gap-1 rounded-md bg-black/20 px-2 py-1 text-xs"><FileText className="h-3 w-3" /> {f}</span>)}
          </div>
        )}
        {m.text}
      </div>
    </div>
  )
}

function AssistantMsg({ m }: { m: Msg }) {
  const [open, setOpen] = useState(true)
  const steps = m.steps ?? []
  const doneCount = steps.filter((s) => s.done).length
  return (
    <div className="flex gap-3">
      <div className="on-accent grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400"><Bot className="h-4 w-4 text-white" /></div>
      <div className="min-w-0 flex-1 space-y-3">
        {steps.length > 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900">
            <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white">
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <Wrench className="h-3.5 w-3.5" />
              {doneCount < steps.length ? `Вызываю инструменты… ${doneCount}/${steps.length}` : `Использовано инструментов: ${steps.length}`}
            </button>
            {open && (
              <div className="space-y-1.5 px-3 pb-3">
                {steps.map((s, i) => <StepRow key={i} s={s} active={!s.done && i === doneCount} />)}
              </div>
            )}
          </div>
        )}
        {(m.text || doneCount === steps.length) && (
          <div className="whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-slate-200">
            {m.text ? renderText(m.text) : <span className="inline-block h-4 w-2 animate-pulse bg-slate-400" />}
          </div>
        )}
        {m.cites && m.cites.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {m.cites.map((c) => (
              <span key={c.n} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-ink-900 px-2 py-1 text-[11px] text-slate-400">
                <span className="grid h-4 w-4 place-items-center rounded bg-violet-500/20 text-[10px] text-violet-300">{c.n}</span>
                {c.title} <span className="text-slate-600">· {c.where}</span>
              </span>
            ))}
          </div>
        )}
        {m.tokens && <div className="text-[11px] text-slate-600">{m.tokens.toLocaleString('ru-RU')} токенов</div>}
      </div>
    </div>
  )
}

function StepRow({ s, active }: { s: Step; active: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/[0.05] bg-ink-850">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left">
        <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-md', s.done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-slate-400')}>
          {s.done ? <Check className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <s.icon className="h-3.5 w-3.5" />}
        </span>
        <span className="font-mono text-xs text-white">{s.tool}</span>
        <span className="truncate text-[11px] text-slate-500">{s.server}</span>
        <span className="ml-auto shrink-0 text-[11px] text-slate-500">{s.done ? `${s.ms} мс` : active ? 'выполняется' : 'в очереди'}</span>
      </button>
      {open && (
        <div className="space-y-1 border-t border-white/[0.05] px-3 py-2 font-mono text-[11px]">
          <div><span className="text-slate-500">args: </span><span className="text-slate-300">{s.args}</span></div>
          {s.done && <div><span className="text-slate-500">result: </span><span className="text-emerald-300">{s.result}</span></div>}
        </div>
      )}
    </div>
  )
}

// minimal **bold**, _italic_ and [n] citation rendering
function renderText(t: string) {
  return t.split(/(\*\*[^*]+\*\*|_[^_]+_|\[\d+\])/g).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="text-white">{p.slice(2, -2)}</strong>
    if (p.startsWith('_') && p.endsWith('_') && p.length > 2) return <em key={i} className="text-slate-500">{p.slice(1, -1)}</em>
    if (/^\[\d+\]$/.test(p)) return <sup key={i} className="mx-0.5 rounded bg-violet-500/20 px-1 text-[10px] text-violet-300">{p.slice(1, -1)}</sup>
    return p
  })
}
