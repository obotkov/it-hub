import { FormEvent, PointerEvent as RPE, useEffect, useMemo, useRef, useState } from 'react'
import {
  MessageSquare, Plus, Paperclip, Send, Bot, FileText, X, ChevronDown, Plug, Search, Check, Puzzle, Library, Upload,
  Workflow, Play, Clapperboard, Mic, Video, AudioLines, Languages, Subtitles, Image as ImageIcon, Laptop, Apple, Download,
  Monitor, Terminal, GitBranch, Zap, Globe, Mail, Database, Code2, Webhook, Clock, Filter, Sparkles, Star, Save,
} from 'lucide-react'
import { Badge, Card, Modal, PageHeader, Table, Tabs, Toggle, cx, StatusDot } from '../../components/ui'

/* ------------------------------ Chat ------------------------------ */

const models = [
  { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', vendor: 'Anthropic', ctx: '1M', tag: 'Лучший' },
  { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', vendor: 'Anthropic', ctx: '1M' },
  { id: 'gpt', name: 'GPT-5', vendor: 'OpenAI', ctx: '400K' },
  { id: 'gemini', name: 'Gemini 3 Pro', vendor: 'Google', ctx: '2M' },
  { id: 'deepseek', name: 'DeepSeek V4', vendor: 'DeepSeek', ctx: '256K', tag: 'Open' },
  { id: 'qwen', name: 'Qwen 3.5 235B', vendor: 'Alibaba', ctx: '256K', tag: 'Open' },
  { id: 'llama', name: 'Llama 5 70B', vendor: 'Meta', ctx: '128K', tag: 'Open' },
]

type Msg = { role: 'user' | 'assistant'; text: string; files?: string[] }

export function Chat() {
  const [model, setModel] = useState(models[0])
  const [pick, setPick] = useState(false)
  const [chats, setChats] = useState([
    { id: 1, title: 'Анализ отчёта по продажам' },
    { id: 2, title: 'SQL для когортного анализа' },
    { id: 3, title: 'Промпт для агента поддержки' },
  ])
  const [active, setActive] = useState(0)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [msgs])

  const send = (e?: FormEvent) => {
    e?.preventDefault()
    if (!text.trim() || busy) return
    const q = text.trim()
    const f = files
    setMsgs((m) => [...m, { role: 'user', text: q, files: f }, { role: 'assistant', text: '' }])
    setText('')
    setFiles([])
    setBusy(true)
    if (!active) {
      const id = Date.now()
      setChats((c) => [{ id, title: q.slice(0, 40) }, ...c])
      setActive(id)
    }
    const answer =
      (f.length ? `Я изучил ${f.length === 1 ? 'файл «' + f[0] + '»' : f.length + ' файла(ов)'}. ` : '') +
      `Это демо-режим платформы: ответ сгенерирован локально, но интерфейс работает так же, как с подключённой моделью ${model.name}.\n\nЧто можно сделать дальше:\n• подключить RAG-базу знаний из RAG Hub, чтобы модель отвечала по вашим документам;\n• добавить MCP-серверы (GitHub, Postgres, Jira) и дать модели доступ к инструментам;\n• сохранить этот диалог как навык в Skill Hub или превратить в агента в Agent World.`
    let i = 0
    const t = setInterval(() => {
      i += 4
      setMsgs((m) => {
        const c = [...m]
        c[c.length - 1] = { role: 'assistant', text: answer.slice(0, i) }
        return c
      })
      if (i >= answer.length) {
        clearInterval(t)
        setBusy(false)
      }
    }, 16)
  }

  const suggestions = ['Сделай саммари PDF-документа', 'Напиши SQL-запрос для воронки', 'Объясни метрики A/B-теста', 'Сгенерируй план миграции в k8s']

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] sm:-m-6 lg:-m-8">
      <div className="hidden w-64 shrink-0 flex-col border-r border-white/[0.05] bg-ink-900/40 p-3 md:flex">
        <button
          onClick={() => {
            setActive(0)
            setMsgs([])
          }}
          className="btn-primary mb-3 w-full"
        >
          <Plus className="h-4 w-4" /> Новый чат
        </button>
        <div className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-wide text-slate-500">История</div>
        <div className="flex-1 space-y-0.5 overflow-y-auto">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActive(c.id)
                setMsgs([
                  { role: 'user', text: c.title },
                  { role: 'assistant', text: 'Это сохранённый диалог из истории. Продолжите разговор — контекст сохранён.' },
                ])
              }}
              className={cx('flex w-full items-center gap-2 truncate rounded-lg px-2 py-2 text-left text-sm', active === c.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5')}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-3">
          <div className="relative">
            <button onClick={() => setPick(!pick)} className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-white hover:bg-white/5">
              <Sparkles className="h-4 w-4 text-violet-400" />
              {model.name}
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
            {pick && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setPick(false)} />
                <div className="absolute z-40 mt-1 w-80 animate-fadeup rounded-2xl border border-white/10 bg-ink-850 p-2 shadow-2xl">
                  {models.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setModel(m)
                        setPick(false)
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/5"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-white">
                          {m.name} {m.tag && <Badge tone={m.tag === 'Open' ? 'cyan' : 'violet'}>{m.tag}</Badge>}
                        </div>
                        <div className="text-xs text-slate-500">{m.vendor} · контекст {m.ctx}</div>
                      </div>
                      {m.id === model.id && <Check className="h-4 w-4 text-violet-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="ml-auto hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <Badge tone="green">RAG: off</Badge>
            <Badge>MCP: 2 подключено</Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {msgs.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-900/40">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">Чем помочь?</h2>
              <p className="mt-2 text-sm text-slate-400">Прикрепляйте файлы и документы — PDF, DOCX, XLSX, изображения, код.</p>
              <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => setText(s)} className="card p-3 text-left text-sm text-slate-300 transition hover:border-white/15">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {msgs.map((m, i) => (
                <div key={i} className={cx('flex gap-3', m.role === 'user' && 'justify-end')}>
                  {m.role === 'assistant' && (
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={cx('max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed', m.role === 'user' ? 'rounded-br-sm bg-violet-600 text-white' : 'rounded-bl-sm bg-white/[0.04] text-slate-200')}>
                    {m.files && m.files.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {m.files.map((f) => (
                          <span key={f} className="inline-flex items-center gap-1 rounded-md bg-black/20 px-2 py-1 text-xs"><FileText className="h-3 w-3" /> {f}</span>
                        ))}
                      </div>
                    )}
                    {m.text || <span className="inline-block h-4 w-2 animate-pulse bg-slate-400" />}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <form onSubmit={send} className="mx-auto w-full max-w-3xl px-4 pb-4">
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={2}
              placeholder={`Сообщение для ${model.name}…`}
              className="w-full resize-none bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-slate-500"
            />
            <div className="flex items-center justify-between">
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => setFiles((x) => [...x, ...Array.from(e.target.files ?? []).map((f) => f.name)])} />
              <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white">
                <Paperclip className="h-4 w-4" /> Файл
              </button>
              <button disabled={!text.trim() || busy} className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-2 text-center text-[11px] text-slate-600">Демо-режим · ответы генерируются локально</div>
        </form>
      </div>
    </div>
  )
}

/* ------------------------------ MCP Hub ------------------------------ */

const mcps = [
  { name: 'GitHub', cat: 'Разработка', desc: 'Репозитории, issues, pull requests', icon: GitBranch, stars: 4.9, installs: '128K' },
  { name: 'PostgreSQL', cat: 'Данные', desc: 'Запросы и схема базы данных', icon: Database, stars: 4.8, installs: '96K' },
  { name: 'Filesystem', cat: 'Система', desc: 'Чтение и запись локальных файлов', icon: FileText, stars: 4.7, installs: '210K' },
  { name: 'Web Search', cat: 'Поиск', desc: 'Поиск в интернете в реальном времени', icon: Globe, stars: 4.8, installs: '180K' },
  { name: 'Slack', cat: 'Коммуникации', desc: 'Каналы, сообщения и треды', icon: MessageSquare, stars: 4.6, installs: '74K' },
  { name: 'Jira', cat: 'Управление', desc: 'Задачи, спринты и доски', icon: Puzzle, stars: 4.5, installs: '61K' },
  { name: 'ClickHouse', cat: 'Данные', desc: 'Аналитические запросы на больших данных', icon: Database, stars: 4.7, installs: '22K' },
  { name: 'Email (IMAP)', cat: 'Коммуникации', desc: 'Чтение и отправка писем', icon: Mail, stars: 4.4, installs: '33K' },
  { name: 'Playwright', cat: 'Разработка', desc: 'Управление браузером и тесты', icon: Monitor, stars: 4.8, installs: '88K' },
  { name: 'Wildmetrics', cat: 'Аналитика', desc: 'Отчёты и события продуктовой аналитики', icon: Zap, stars: 5.0, installs: 'Новый' },
  { name: 'Kubernetes', cat: 'Инфраструктура', desc: 'Поды, деплойменты и логи', icon: Code2, stars: 4.6, installs: '19K' },
  { name: 'Webhooks', cat: 'Система', desc: 'Вызов произвольных HTTP-эндпоинтов', icon: Webhook, stars: 4.3, installs: '41K' },
]

export function McpHub() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Все')
  const [on, setOn] = useState<Record<string, boolean>>({ GitHub: true, 'Web Search': true })
  const cats = ['Все', ...Array.from(new Set(mcps.map((m) => m.cat)))]
  const list = mcps.filter((m) => (cat === 'Все' || m.cat === cat) && m.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHeader
        title="MCP Hub"
        subtitle="Model Context Protocol — подключайте внешние инструменты и данные к моделям и агентам одним кликом."
        icon={Plug}
        actions={<button className="btn-primary"><Plus className="h-4 w-4" /> Свой MCP-сервер</button>}
      />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="input pl-9" placeholder="Поиск MCP-серверов" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cx('rounded-full border px-3 py-1 text-xs transition', cat === c ? 'border-violet-500/50 bg-violet-500/15 text-violet-200' : 'border-white/10 text-slate-400 hover:text-white')}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((m) => (
          <div key={m.name} className="card flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5"><m.icon className="h-5 w-5 text-slate-200" /></div>
              <Toggle on={!!on[m.name]} onChange={(v) => setOn((o) => ({ ...o, [m.name]: v }))} />
            </div>
            <div className="mt-4 flex items-center gap-2 font-medium text-white">{m.name} {on[m.name] && <Badge tone="green">Подключён</Badge>}</div>
            <p className="mt-1 flex-1 text-sm text-slate-400">{m.desc}</p>
            <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
              <Badge>{m.cat}</Badge>
              <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {m.stars}</span>
              <span>{m.installs} установок</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ------------------------------ Skill Hub ------------------------------ */

const skills = [
  { name: 'Анализ договоров', author: 'AI Studio', desc: 'Находит риски и нестандартные условия в договорах', uses: '12.4K', cat: 'Юристы' },
  { name: 'SQL-аналитик', author: 'AI Studio', desc: 'Пишет и оптимизирует SQL под вашу схему', uses: '31K', cat: 'Данные' },
  { name: 'Код-ревьюер', author: 'community', desc: 'Ревью pull request с фокусом на баги и безопасность', uses: '22K', cat: 'Разработка' },
  { name: 'Маркетинговые тексты', author: 'community', desc: 'Посты, рассылки и лендинги в тоне бренда', uses: '18K', cat: 'Маркетинг' },
  { name: 'Презентации', author: 'AI Studio', desc: 'Генерация слайдов PPTX из документа', uses: '9.7K', cat: 'Офис' },
  { name: 'Исследование рынка', author: 'community', desc: 'Глубокий поиск с отчётом и источниками', uses: '15K', cat: 'Аналитика' },
  { name: 'Excel-мастер', author: 'AI Studio', desc: 'Формулы, сводные таблицы и графики в XLSX', uses: '27K', cat: 'Офис' },
  { name: 'Поддержка клиентов', author: 'community', desc: 'Ответы клиентам по базе знаний', uses: '11K', cat: 'Сервис' },
]

export function SkillHub() {
  const [tab, setTab] = useState<'catalog' | 'mine'>('catalog')
  const [mine, setMine] = useState<string[]>(['SQL-аналитик'])
  const list = tab === 'catalog' ? skills : skills.filter((s) => mine.includes(s.name))
  return (
    <>
      <PageHeader title="Skill Hub" subtitle="Навыки — упакованные инструкции, скрипты и шаблоны, которые расширяют возможности моделей и агентов." icon={Puzzle} actions={<button className="btn-primary"><Plus className="h-4 w-4" /> Создать навык</button>} />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'catalog', label: 'Каталог' }, { id: 'mine', label: `Мои навыки (${mine.length})` }]} /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((s) => {
          const added = mine.includes(s.name)
          return (
            <div key={s.name} className="card flex flex-col p-5">
              <div className="flex items-center justify-between">
                <Badge tone="violet">{s.cat}</Badge>
                <span className="text-xs text-slate-500">{s.uses} исп.</span>
              </div>
              <div className="mt-4 font-medium text-white">{s.name}</div>
              <p className="mt-1 flex-1 text-sm text-slate-400">{s.desc}</p>
              <div className="mt-2 text-xs text-slate-500">@{s.author}</div>
              <button onClick={() => setMine((m) => (added ? m.filter((x) => x !== s.name) : [...m, s.name]))} className={cx('mt-4 w-full', added ? 'btn-ghost' : 'btn-primary')}>
                {added ? <><Check className="h-4 w-4" /> Добавлен</> : <><Plus className="h-4 w-4" /> Добавить</>}
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ------------------------------ RAG Hub ------------------------------ */

export function RagHub() {
  const [bases, setBases] = useState([
    { name: 'Внутренняя wiki', docs: 1240, chunks: '48K', emb: 'bge-m3', status: 'running' as const, updated: 'сегодня' },
    { name: 'Договоры 2026', docs: 312, chunks: '9.1K', emb: 'text-embedding-3-large', status: 'running' as const, updated: 'вчера' },
    { name: 'Техподдержка FAQ', docs: 86, chunks: '1.2K', emb: 'bge-m3', status: 'pending' as const, updated: 'индексация…' },
  ])
  const [modal, setModal] = useState(false)
  const [name, setName] = useState('')
  const [q, setQ] = useState('')
  const [res, setRes] = useState<string | null>(null)
  return (
    <>
      <PageHeader title="RAG Hub" subtitle="Создавайте базы знаний из документов, сайтов и баз данных. Подключайте их к чатам и агентам." icon={Library} actions={<button onClick={() => setModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> База знаний</button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Базы знаний" className="lg:col-span-2">
          <Table
            head={['Название', 'Документы', 'Чанки', 'Эмбеддинги', 'Статус', 'Обновлено']}
            rows={bases.map((b) => [<span className="font-medium text-white">{b.name}</span>, b.docs, b.chunks, <span className="font-mono text-xs">{b.emb}</span>, <StatusDot status={b.status} />, b.updated])}
          />
        </Card>
        <Card title="Проверка поиска">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setRes(q)
            }}
            className="space-y-3"
          >
            <select className="input"><option>Внутренняя wiki</option><option>Договоры 2026</option></select>
            <input className="input" placeholder="Как оформить отпуск?" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn-primary w-full"><Search className="h-4 w-4" /> Найти</button>
          </form>
          {res && (
            <div className="mt-4 space-y-2">
              {[0.92, 0.87, 0.81].map((s, i) => (
                <div key={s} className="rounded-xl border border-white/5 bg-ink-850 p-3 text-xs">
                  <div className="mb-1 flex justify-between text-slate-500"><span>hr/policy-{i + 1}.pdf · стр. {i * 3 + 2}</span><span className="text-emerald-400">{s}</span></div>
                  <div className="text-slate-300">…фрагмент документа, релевантный запросу «{res}»…</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Новая база знаний">
        <div className="space-y-4">
          <div><label className="label">Название</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Документация продукта" /></div>
          <div>
            <label className="label">Источники</label>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400 hover:border-violet-500/50">
              <Upload className="h-6 w-6" /> Перетащите файлы или нажмите для выбора
              <span className="text-xs text-slate-500">PDF, DOCX, TXT, MD, HTML, CSV — до 500 МБ</span>
              <input type="file" multiple hidden />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Модель эмбеддингов</label><select className="input"><option>bge-m3</option><option>text-embedding-3-large</option><option>multilingual-e5</option></select></div>
            <div><label className="label">Размер чанка</label><select className="input"><option>512 токенов</option><option>1024 токена</option></select></div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(false)} className="btn-ghost">Отмена</button>
            <button
              onClick={() => {
                setBases((b) => [...b, { name: name || 'Новая база', docs: 0, chunks: '0', emb: 'bge-m3', status: 'pending', updated: 'индексация…' }])
                setModal(false)
                setName('')
              }}
              className="btn-primary"
            >
              Создать
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/* ------------------------------ Agent World ------------------------------ */

type NodeT = { id: string; x: number; y: number; type: string; title: string }
const nodeTypes: Record<string, { icon: typeof Bot; color: string; label: string }> = {
  trigger: { icon: Webhook, color: '#f59e0b', label: 'Триггер' },
  schedule: { icon: Clock, color: '#f59e0b', label: 'Расписание' },
  agent: { icon: Bot, color: '#a78bfa', label: 'AI-агент' },
  rag: { icon: Library, color: '#22d3ee', label: 'RAG-поиск' },
  tool: { icon: Plug, color: '#34d399', label: 'MCP-инструмент' },
  condition: { icon: Filter, color: '#f472b6', label: 'Условие' },
  output: { icon: Send, color: '#60a5fa', label: 'Отправка' },
}

export function AgentWorld() {
  const [nodes, setNodes] = useState<NodeT[]>([
    { id: 'n1', x: 40, y: 150, type: 'trigger', title: 'Новое письмо' },
    { id: 'n2', x: 300, y: 60, type: 'rag', title: 'Поиск в FAQ' },
    { id: 'n3', x: 300, y: 250, type: 'agent', title: 'Классификатор' },
    { id: 'n4', x: 560, y: 150, type: 'agent', title: 'Агент-ответчик' },
    { id: 'n5', x: 820, y: 80, type: 'output', title: 'Ответ клиенту' },
    { id: 'n6', x: 820, y: 240, type: 'tool', title: 'Задача в Jira' },
  ])
  const [edges, setEdges] = useState<[string, string][]>([
    ['n1', 'n2'], ['n1', 'n3'], ['n2', 'n4'], ['n3', 'n4'], ['n4', 'n5'], ['n4', 'n6'],
  ])
  const [sel, setSel] = useState<string | null>('n4')
  const [running, setRunning] = useState(-1)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const W = 200, H = 64

  const onDown = (e: RPE, n: NodeT) => {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { id: n.id, dx: e.clientX - n.x, dy: e.clientY - n.y }
    setSel(n.id)
  }
  const onMove = (e: RPE) => {
    const d = drag.current
    if (!d) return
    setNodes((ns) => ns.map((n) => (n.id === d.id ? { ...n, x: Math.max(0, e.clientX - d.dx), y: Math.max(0, e.clientY - d.dy) } : n)))
  }
  const add = (type: string) => {
    const id = 'n' + Date.now()
    setNodes((ns) => [...ns, { id, x: 120 + Math.random() * 400, y: 340 + Math.random() * 40, type, title: nodeTypes[type].label }])
    if (sel) setEdges((es) => [...es, [sel, id]])
    setSel(id)
  }
  const run = () => {
    const order = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6']
    let i = 0
    setRunning(0)
    const t = setInterval(() => {
      i++
      if (i > order.length) {
        clearInterval(t)
        setRunning(-1)
      } else setRunning(i)
    }, 500)
  }
  const selNode = nodes.find((n) => n.id === sel)
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes])

  return (
    <>
      <PageHeader
        title="Agent World"
        subtitle="Собирайте workflow из агентов, инструментов и условий. Запускайте по триггеру, расписанию или через API."
        icon={Workflow}
        actions={<><button className="btn-ghost"><Save className="h-4 w-4" /> Сохранить</button><button onClick={run} className="btn-primary"><Play className="h-4 w-4" /> Запустить</button></>}
      />
      <div className="grid gap-4 xl:grid-cols-[200px_1fr_280px]">
        <Card title="Блоки" className="p-4">
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
            {Object.entries(nodeTypes).map(([k, v]) => (
              <button key={k} onClick={() => add(k)} className="flex items-center gap-2 rounded-xl border border-white/5 bg-ink-850 px-3 py-2 text-left text-sm text-slate-300 hover:border-white/15">
                <v.icon className="h-4 w-4" style={{ color: v.color }} /> {v.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Новый блок соединяется с выбранным. Узлы можно перетаскивать.</p>
        </Card>
        <div className="card dot-bg relative h-[560px] overflow-auto" onPointerMove={onMove} onPointerUp={() => (drag.current = null)}>
          <div className="relative" style={{ width: 1100, height: 520 }}>
            <svg className="pointer-events-none absolute inset-0" width="1100" height="520">
              {edges.map(([a, b], i) => {
                const A = byId[a], B = byId[b]
                if (!A || !B) return null
                const x1 = A.x + W, y1 = A.y + H / 2, x2 = B.x, y2 = B.y + H / 2
                const mx = (x1 + x2) / 2
                const live = running >= 0 && nodes.findIndex((n) => n.id === b) < running
                return (
                  <path key={i} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none" stroke={live ? '#a78bfa' : 'rgba(255,255,255,0.15)'} strokeWidth={live ? 2.5 : 1.5} strokeDasharray={live ? '6 4' : undefined}>
                    {live && <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.6s" repeatCount="indefinite" />}
                  </path>
                )
              })}
            </svg>
            {nodes.map((n, idx) => {
              const t = nodeTypes[n.type]
              const done = running >= 0 && idx < running
              return (
                <div
                  key={n.id}
                  onPointerDown={(e) => onDown(e, n)}
                  className={cx('absolute flex cursor-grab touch-none select-none items-center gap-3 rounded-2xl border bg-ink-850 px-3 shadow-xl transition-[border-color,box-shadow] active:cursor-grabbing', sel === n.id ? 'border-violet-500/70 shadow-violet-900/40' : 'border-white/10')}
                  style={{ left: n.x, top: n.y, width: W, height: H }}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: t.color + '22' }}><t.icon className="h-4 w-4" style={{ color: t.color }} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">{n.title}</span>
                    <span className="block text-[11px] text-slate-500">{t.label}</span>
                  </span>
                  {done && <Check className="ml-auto h-4 w-4 text-emerald-400" />}
                  <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-ink-850 bg-slate-500" />
                  <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-ink-850 bg-violet-400" />
                </div>
              )
            })}
          </div>
        </div>
        <Card title="Свойства" className="p-4">
          {selNode ? (
            <div className="space-y-4">
              <div>
                <label className="label">Название</label>
                <input className="input" value={selNode.title} onChange={(e) => setNodes((ns) => ns.map((n) => (n.id === selNode.id ? { ...n, title: e.target.value } : n)))} />
              </div>
              {selNode.type === 'agent' && (
                <>
                  <div><label className="label">Модель</label><select className="input">{models.map((m) => <option key={m.id}>{m.name}</option>)}</select></div>
                  <div><label className="label">Системный промпт</label><textarea className="input h-28 resize-none" defaultValue="Ты — вежливый агент поддержки. Отвечай кратко, используя найденные фрагменты базы знаний." /></div>
                  <div><label className="label">Инструменты</label><div className="flex flex-wrap gap-1.5"><Badge tone="green">GitHub</Badge><Badge tone="green">Jira</Badge><Badge tone="cyan">RAG: FAQ</Badge></div></div>
                </>
              )}
              {selNode.type !== 'agent' && <p className="text-sm text-slate-400">Настройки блока «{nodeTypes[selNode.type].label}».</p>}
              <button
                onClick={() => {
                  setNodes((ns) => ns.filter((n) => n.id !== selNode.id))
                  setEdges((es) => es.filter(([a, b]) => a !== selNode.id && b !== selNode.id))
                  setSel(null)
                }}
                className="btn-ghost w-full text-rose-300"
              >
                Удалить блок
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Выберите блок на холсте</p>
          )}
        </Card>
      </div>
    </>
  )
}

/* ------------------------------ Media agents ------------------------------ */

export function MediaAgents() {
  const tools = [
    { icon: Subtitles, t: 'Транскрибация', d: 'Аудио и видео в текст с таймкодами и спикерами', c: 'from-violet-500 to-fuchsia-500' },
    { icon: Mic, t: 'Синтез речи', d: 'Озвучка текста реалистичными голосами', c: 'from-sky-500 to-indigo-500' },
    { icon: Languages, t: 'Дубляж и перевод', d: 'Перевод видео с сохранением голоса', c: 'from-emerald-500 to-teal-500' },
    { icon: Video, t: 'Генерация видео', d: 'Видео по текстовому описанию или изображению', c: 'from-orange-500 to-rose-500' },
    { icon: AudioLines, t: 'Очистка звука', d: 'Удаление шума и разделение дорожек', c: 'from-cyan-500 to-blue-500' },
    { icon: ImageIcon, t: 'Саммари встречи', d: 'Протокол, задачи и решения из записи созвона', c: 'from-pink-500 to-orange-400' },
  ]
  return (
    <>
      <PageHeader title="Audio / Video агенты" subtitle="Агенты для работы с медиа: от транскрибации созвонов до генерации видео." icon={Clapperboard} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((x) => (
          <div key={x.t} className="card group p-5 transition hover:border-white/15">
            <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${x.c}`}><x.icon className="h-5 w-5 text-white" /></div>
            <div className="mt-4 font-medium text-white">{x.t}</div>
            <p className="mt-1 text-sm text-slate-400">{x.d}</p>
            <button className="btn-ghost mt-4 w-full"><Upload className="h-4 w-4" /> Загрузить файл</button>
          </div>
        ))}
      </div>
      <Card title="Последние задачи">
        <Table
          head={['Файл', 'Агент', 'Длительность', 'Статус', 'Результат']}
          rows={[
            ['standup-17-11.mp4', 'Саммари встречи', '42:18', <StatusDot status="running" />, <span className="text-violet-300">протокол.md</span>],
            ['podcast-ep12.mp3', 'Транскрибация', '1:12:05', <StatusDot status="stopped" />, <span className="text-violet-300">transcript.srt</span>],
            ['promo-ru.mp4', 'Дубляж EN', '0:58', <StatusDot status="pending" />, '—'],
          ]}
        />
      </Card>
    </>
  )
}

/* ------------------------------ Code agent ------------------------------ */

export function CodeAgent() {
  return (
    <>
      <PageHeader title="Code-агент для ПК" subtitle="Десктоп-приложение: AI-агент, который читает ваш проект, пишет код, запускает тесты и делает коммиты." icon={Laptop} badge="beta" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card relative overflow-hidden p-8">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl" />
          <Apple className="h-10 w-10 text-white" />
          <h3 className="mt-5 text-xl font-semibold text-white">macOS</h3>
          <p className="mt-1 text-sm text-slate-400">Apple Silicon и Intel · macOS 13+</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="btn-primary"><Download className="h-4 w-4" /> Скачать .dmg</button>
            <button className="btn-ghost">Homebrew</button>
          </div>
        </div>
        <div className="card relative overflow-hidden p-8">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />
          <Monitor className="h-10 w-10 text-white" />
          <h3 className="mt-5 text-xl font-semibold text-white">Windows</h3>
          <p className="mt-1 text-sm text-slate-400">Windows 10/11 · x64 и ARM64</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="btn-primary"><Download className="h-4 w-4" /> Скачать .exe</button>
            <button className="btn-ghost">winget</button>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Возможности" className="lg:col-span-1">
          <ul className="space-y-3 text-sm text-slate-300">
            {['Понимает весь репозиторий', 'Редактирует файлы и запускает команды', 'Работает с git: ветки, коммиты, PR', 'Подключает MCP и навыки из хаба', 'Любая модель из AI Platform'].map((f) => (
              <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" /> {f}</li>
            ))}
          </ul>
        </Card>
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5 text-xs text-slate-500"><Terminal className="h-4 w-4" /> ai-studio code</div>
          <pre className="p-5 font-mono text-xs leading-6 text-slate-300">
            <span className="text-slate-500">$</span> ai-studio code{'\n'}
            <span className="text-violet-300">›</span> Добавь эндпоинт /health и покрой тестом{'\n'}
            <span className="text-slate-500">  ● Читаю src/server.ts, src/routes/…</span>{'\n'}
            <span className="text-emerald-400">  ✓ Изменён src/routes/health.ts (+18)</span>{'\n'}
            <span className="text-emerald-400">  ✓ Добавлен tests/health.test.ts (+24)</span>{'\n'}
            <span className="text-slate-500">  ● npm test …</span> <span className="text-emerald-400">12 passed</span>{'\n'}
            <span className="text-violet-300">›</span> <span className="animate-pulse">▍</span>
          </pre>
        </div>
      </div>
    </>
  )
}
