import { useState } from 'react'
import { KeyRound, Plus, Copy, Check, Trash2, Activity, Coins, Timer, Zap, Play, Loader2, Eye, EyeOff, BookOpen, ShieldCheck } from 'lucide-react'
import { Badge, Card, Code, Modal, PageHeader, Stat, Table, Tabs, cx } from '../../components/ui'
import { BarChart, LineChart, days, series } from '../../components/charts'
import { models } from './ai'

const BASE_URL = 'https://api.ai-studio.space/v1'

const pricing: { id: string; in: number; out: number; rpm: string }[] = [
  { id: 'claude-opus-5-5', in: 1350, out: 6750, rpm: '4 000' },
  { id: 'claude-sonnet-5-5', in: 270, out: 1350, rpm: '10 000' },
  { id: 'gpt', in: 112, out: 900, rpm: '10 000' },
  { id: 'gemini', in: 112, out: 900, rpm: '10 000' },
  { id: 'deepseek', in: 25, out: 100, rpm: '20 000' },
  { id: 'qwen', in: 20, out: 60, rpm: '20 000' },
  { id: 'llama', in: 15, out: 45, rpm: '20 000' },
]

type ApiKey = { id: string; name: string; prefix: string; project: string; created: string; last: string; limit: string; scopes: string[] }

const genKey = () => 'sk-hub-' + Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 40)

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {})
        setOk(true)
        setTimeout(() => setOk(false), 1500)
      }}
      className={cx('rounded-lg bg-white/5 p-1.5 text-slate-400 hover:text-white', className)}
      title="Копировать"
    >
      {ok ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}

export function LlmApi() {
  const [tab, setTab] = useState<'start' | 'keys' | 'models' | 'usage' | 'playground'>('start')
  const [keys, setKeys] = useState<ApiKey[]>([
    { id: 'k1', name: 'production-backend', prefix: 'sk-hub-7f3a…q2', project: 'Основной сайт', created: '02.10.2026', last: '2 мин назад', limit: '50 000 ₽/мес', scopes: ['chat', 'embeddings'] },
    { id: 'k2', name: 'telegram-bot', prefix: 'sk-hub-k91c…zx', project: 'Боты', created: '21.10.2026', last: 'вчера', limit: '5 000 ₽/мес', scopes: ['chat'] },
  ])
  const [modal, setModal] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', project: 'Основной сайт', limit: '10000', scopes: { chat: true, embeddings: true, images: false, audio: false } as Record<string, boolean> })

  const create = () => {
    const k = genKey()
    setKeys((x) => [
      { id: 'k' + Date.now(), name: form.name || 'new-key', prefix: `${k.slice(0, 11)}…${k.slice(-2)}`, project: form.project, created: new Date().toLocaleDateString('ru-RU'), last: 'никогда', limit: form.limit ? `${(+form.limit).toLocaleString('ru-RU')} ₽/мес` : 'без лимита', scopes: Object.keys(form.scopes).filter((s) => form.scopes[s]) },
      ...x,
    ])
    setNewKey(k)
  }

  return (
    <>
      <PageHeader
        title="LLM API"
        subtitle="Подключайте любые модели из хаба к своему проекту по OpenAI-совместимому API: один ключ, один биллинг, десятки моделей."
        icon={KeyRound}
        actions={
          <>
            <button onClick={() => setTab('start')} className="btn-ghost"><BookOpen className="h-4 w-4" /> Документация</button>
            <button onClick={() => { setNewKey(null); setModal(true) }} className="btn-primary"><Plus className="h-4 w-4" /> Создать ключ</button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Запросов за 30 дней" value="1.84M" delta="+22%" icon={Activity} />
        <Stat label="Токенов" value="612M" delta="+18%" icon={Zap} />
        <Stat label="Расходы" value="14 380 ₽" delta="+9%" icon={Coins} />
        <Stat label="Задержка p50" value="420 мс" delta="-35 мс" icon={Timer} />
      </div>

      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'start', label: 'Быстрый старт' },
            { id: 'keys', label: `API-ключи (${keys.length})` },
            { id: 'models', label: 'Модели и цены' },
            { id: 'usage', label: 'Использование' },
            { id: 'playground', label: 'Playground' },
          ]}
        />
      </div>

      {tab === 'start' && <QuickStart onKeys={() => setTab('keys')} />}

      {tab === 'keys' && (
        <Card>
          <Table
            head={['Название', 'Ключ', 'Проект', 'Права', 'Лимит', 'Использован', 'Создан', '']}
            rows={keys.map((k) => [
              <span className="font-medium text-white">{k.name}</span>,
              <span className="font-mono text-xs">{k.prefix}</span>,
              k.project,
              <div className="flex gap-1">{k.scopes.map((s) => <Badge key={s} tone="violet">{s}</Badge>)}</div>,
              k.limit,
              k.last,
              k.created,
              <button onClick={() => setKeys((x) => x.filter((y) => y.id !== k.id))} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-rose-400" title="Отозвать ключ"><Trash2 className="h-4 w-4" /></button>,
            ])}
          />
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-ink-850 p-3 text-xs text-slate-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            Ключ показывается один раз при создании. Храните его в переменных окружения сервера и никогда не публикуйте во фронтенд-коде.
          </div>
        </Card>
      )}

      {tab === 'models' && (
        <Card>
          <Table
            head={['Модель', 'ID для API', 'Контекст', 'Вход, ₽ / 1M', 'Выход, ₽ / 1M', 'Лимит RPM']}
            rows={pricing.map((p) => {
              const m = models.find((x) => x.id === p.id)!
              return [
                <span className="flex items-center gap-2 text-white">{m.name} {m.tag && <Badge tone={m.tag === 'Open' ? 'cyan' : 'violet'}>{m.tag}</Badge>}</span>,
                <span className="flex items-center gap-1.5 font-mono text-xs">{apiId(p.id)} <CopyBtn text={apiId(p.id)} className="p-1" /></span>,
                m.ctx,
                p.in.toLocaleString('ru-RU'),
                p.out.toLocaleString('ru-RU'),
                p.rpm,
              ]
            })}
          />
          <p className="mt-3 text-xs text-slate-500">Также доступны эмбеддинги (bge-m3, text-embedding-3-large), распознавание речи (whisper) и генерация изображений.</p>
        </Card>
      )}

      {tab === 'usage' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Запросы по дням" className="lg:col-span-2">
            <LineChart labels={days(30)} series={[{ name: 'Успешные', data: series(30, 52000, 26000, 4), color: '#a78bfa' }, { name: 'Ошибки', data: series(30, 900, 600, 9), color: '#f43f5e' }]} />
          </Card>
          <Card title="Расходы по моделям, ₽">
            <BarChart data={[{ label: 'Opus', value: 6120 }, { label: 'Sonnet', value: 4380 }, { label: 'GPT', value: 2110 }, { label: 'DeepSeek', value: 1090 }, { label: 'Qwen', value: 680 }]} />
          </Card>
          <Card title="По ключам" className="lg:col-span-3">
            <Table
              head={['Ключ', 'Запросы', 'Токены вход', 'Токены выход', 'Ошибки', 'Расходы']}
              rows={keys.map((k, i) => [
                <span className="font-mono text-xs text-white">{k.name}</span>,
                (1520000 / (i + 1)).toLocaleString('ru-RU'),
                `${Math.round(410 / (i + 1))}M`,
                `${Math.round(120 / (i + 1))}M`,
                `${(0.4 + i * 0.3).toFixed(1)}%`,
                `${Math.round(12400 / (i + 1)).toLocaleString('ru-RU')} ₽`,
              ])}
            />
          </Card>
        </div>
      )}

      {tab === 'playground' && <Playground />}

      <Modal open={modal} onClose={() => setModal(false)} title={newKey ? 'Ключ создан' : 'Новый API-ключ'}>
        {newKey ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Скопируйте ключ сейчас — после закрытия окна он больше не будет показан.</p>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3">
              <code className="flex-1 break-all font-mono text-xs text-white">{newKey}</code>
              <CopyBtn text={newKey} />
            </div>
            <Code>{`export AI_STUDIO_API_KEY="${newKey}"`}</Code>
            <div className="flex justify-end"><button onClick={() => { setModal(false); setTab('keys') }} className="btn-primary">Готово</button></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div><label className="label">Название</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="my-app-backend" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Проект</label><select className="input" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}><option>Основной сайт</option><option>Боты</option><option>Внутренние сервисы</option></select></div>
              <div><label className="label">Лимит, ₽/мес</label><input className="input" inputMode="numeric" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value.replace(/\D/g, '') })} placeholder="без лимита" /></div>
            </div>
            <div>
              <label className="label">Права</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(form.scopes).map((s) => (
                  <label key={s} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-ink-850 px-3 py-2 text-sm">
                    <input type="checkbox" className="accent-violet-500" checked={form.scopes[s]} onChange={(e) => setForm({ ...form, scopes: { ...form.scopes, [s]: e.target.checked } })} /> {s}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2"><button onClick={() => setModal(false)} className="btn-ghost">Отмена</button><button onClick={create} className="btn-primary">Создать</button></div>
          </div>
        )}
      </Modal>
    </>
  )
}

const apiId = (id: string) =>
  ({ gpt: 'gpt-5', gemini: 'gemini-3-pro', deepseek: 'deepseek-v4', qwen: 'qwen3.5-235b', llama: 'llama-5-70b' } as Record<string, string>)[id] ?? id

function QuickStart({ onKeys }: { onKeys: () => void }) {
  const [lang, setLang] = useState<'curl' | 'python' | 'node' | 'php'>('python')
  const snippets = {
    curl: `curl ${BASE_URL}/chat/completions \\
  -H "Authorization: Bearer $AI_STUDIO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-5-5",
    "messages": [{"role": "user", "content": "Привет! Что ты умеешь?"}]
  }'`,
    python: `# pip install openai
import os
from openai import OpenAI

client = OpenAI(
    base_url="${BASE_URL}",
    api_key=os.environ["AI_STUDIO_API_KEY"],
)

resp = client.chat.completions.create(
    model="claude-sonnet-5-5",
    messages=[{"role": "user", "content": "Привет! Что ты умеешь?"}],
)
print(resp.choices[0].message.content)`,
    node: `// npm i openai
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: '${BASE_URL}',
  apiKey: process.env.AI_STUDIO_API_KEY,
})

const resp = await client.chat.completions.create({
  model: 'claude-sonnet-5-5',
  messages: [{ role: 'user', content: 'Привет! Что ты умеешь?' }],
  stream: false,
})
console.log(resp.choices[0].message.content)`,
    php: `<?php
$ch = curl_init('${BASE_URL}/chat/completions');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer ' . getenv('AI_STUDIO_API_KEY'),
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'model' => 'claude-sonnet-5-5',
    'messages' => [['role' => 'user', 'content' => 'Привет!']],
  ]),
]);
echo json_decode(curl_exec($ch))->choices[0]->message->content;`,
  }
  const steps = [
    { t: 'Создайте API-ключ', d: 'Ограничьте его проектом, правами и месячным лимитом.', a: <button onClick={onKeys} className="btn-ghost px-3 py-1.5 text-xs">К ключам</button> },
    { t: 'Укажите base URL', d: 'API совместим с OpenAI SDK — меняется только адрес и ключ.', a: <span className="flex items-center gap-1 font-mono text-xs text-slate-300">{BASE_URL} <CopyBtn text={BASE_URL} className="p-1" /></span> },
    { t: 'Выберите модель', d: 'Переключайтесь между моделями, меняя одно поле model.', a: null },
  ]
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <Card
        title="Пример запроса"
        action={<Tabs value={lang} onChange={setLang} tabs={[{ id: 'python', label: 'Python' }, { id: 'node', label: 'Node.js' }, { id: 'curl', label: 'cURL' }, { id: 'php', label: 'PHP' }]} />}
      >
        <div className="relative">
          <Code>{snippets[lang]}</Code>
          <CopyBtn text={snippets[lang]} className="absolute right-2 top-2" />
        </div>
        <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
          {['Стриминг (SSE)', 'Function calling и JSON-режим', 'Vision и файлы', 'Эмбеддинги', 'Batch API со скидкой 50%', 'Кэширование промптов'].map((f) => (
            <span key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-violet-400" /> {f}</span>
          ))}
        </div>
      </Card>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={s.t} className="card p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/15 text-sm font-semibold text-violet-300">{i + 1}</span>
              <span className="font-medium text-white">{s.t}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{s.d}</p>
            {s.a && <div className="mt-3">{s.a}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Playground() {
  const [model, setModel] = useState('claude-sonnet-5-5')
  const [prompt, setPrompt] = useState('Напиши слоган для IT-хаба в 5 словах')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const run = () => {
    setBusy(true)
    setRes(null)
    setTimeout(() => {
      const content = 'Все IT-сервисы — в одном месте.'
      setRes(
        JSON.stringify(
          {
            id: 'chatcmpl-' + Math.random().toString(36).slice(2, 12),
            object: 'chat.completion',
            model: apiId(model),
            choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
            usage: { prompt_tokens: Math.ceil(prompt.length / 3), completion_tokens: 11, total_tokens: Math.ceil(prompt.length / 3) + 11 },
          },
          null,
          2,
        ),
      )
      setBusy(false)
    }, 900)
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Запрос">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Модель</label><select className="input" value={model} onChange={(e) => setModel(e.target.value)}>{models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            <div>
              <label className="label">Ключ</label>
              <div className="relative">
                <input className="input pr-9 font-mono text-xs" readOnly value={showKey ? 'sk-hub-playground-demo-key' : '••••••••••••••••••••'} />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
          </div>
          <div><label className="label">messages[0].content</label><textarea className="input h-32 resize-none" value={prompt} onChange={(e) => setPrompt(e.target.value)} /></div>
          <button onClick={run} disabled={busy || !prompt.trim()} className="btn-primary">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Отправить запрос</button>
        </div>
      </Card>
      <Card title="Ответ" action={res && <Badge tone="green">200 OK · 0.9 с</Badge>}>
        {res ? <Code>{res}</Code> : <div className="grid h-48 place-items-center text-sm text-slate-500">{busy ? 'Ожидание ответа…' : 'Отправьте запрос, чтобы увидеть JSON-ответ'}</div>}
        <p className="mt-3 text-xs text-slate-500">Демо-режим: ответ сгенерирован локально.</p>
      </Card>
    </div>
  )
}
