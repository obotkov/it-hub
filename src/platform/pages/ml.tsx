import { useEffect, useState } from 'react'
import { FlaskConical, Cpu, Rocket, Plus, Play, Square, Database, Copy, Check } from 'lucide-react'
import { Badge, Card, Code, Modal, PageHeader, Stat, StatusDot, Table, Tabs } from '../../components/ui'
import { LineChart, Sparkline, series } from '../../components/charts'

export function MlProjects() {
  const projects = [
    { name: 'churn-prediction', task: 'Классификация', runs: 48, best: 'AUC 0.912', data: 'users_2026.parquet', owner: 'вы' },
    { name: 'demand-forecast', task: 'Временные ряды', runs: 23, best: 'MAPE 7.4%', data: 'sales_daily', owner: 'команда' },
    { name: 'support-intent', task: 'NLP / fine-tune', runs: 12, best: 'F1 0.88', data: 'tickets.jsonl', owner: 'вы' },
    { name: 'product-recs', task: 'Рекомендации', runs: 31, best: 'NDCG 0.41', data: 'events_ch', owner: 'команда' },
  ]
  return (
    <>
      <PageHeader title="ML Platform" subtitle="Полный цикл машинного обучения без выхода из интерфейса: данные → эксперименты → обучение → деплой." icon={FlaskConical} actions={<button className="btn-primary"><Plus className="h-4 w-4" /> Новый проект</button>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Проекты" value="4" icon={FlaskConical} />
        <Stat label="Эксперименты" value="114" delta="+9" icon={Cpu} />
        <Stat label="Датасеты" value="17" icon={Database} />
        <Stat label="Модели в проде" value="3" icon={Rocket} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((p, i) => (
          <div key={p.name} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-sm font-medium text-white">{p.name}</div>
                <div className="mt-1 flex gap-2"><Badge tone="cyan">{p.task}</Badge><Badge>{p.owner}</Badge></div>
              </div>
              <Sparkline data={series(14, 50, 30, i + 2)} color="#60a5fa" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/5 pt-4 text-sm">
              <div><div className="text-xs text-slate-500">Запусков</div><div className="text-white">{p.runs}</div></div>
              <div><div className="text-xs text-slate-500">Лучший</div><div className="text-emerald-300">{p.best}</div></div>
              <div><div className="text-xs text-slate-500">Данные</div><div className="truncate font-mono text-xs text-slate-300">{p.data}</div></div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export function MlTraining() {
  const [running, setRunning] = useState(true)
  const [epoch, setEpoch] = useState(14)
  const [modal, setModal] = useState(false)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setEpoch((e) => (e >= 30 ? 30 : e + 1)), 1500)
    return () => clearInterval(t)
  }, [running])
  const loss = Array.from({ length: epoch }, (_, i) => +(2.4 * Math.exp(-i / 8) + 0.15 + Math.sin(i) * 0.03).toFixed(3))
  const val = loss.map((l, i) => +(l + 0.05 + Math.cos(i) * 0.04).toFixed(3))
  return (
    <>
      <PageHeader title="Обучение" subtitle="Запускайте обучение на GPU прямо из браузера. Логи, метрики и чекпоинты — в реальном времени." icon={Cpu} actions={<button onClick={() => setModal(true)} className="btn-primary"><Play className="h-4 w-4" /> Новый запуск</button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="support-intent · run #12"
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-3">
              <StatusDot status={running && epoch < 30 ? 'running' : 'stopped'} />
              <button onClick={() => setRunning(!running)} className="btn-ghost px-2.5 py-1.5 text-xs">{running ? <><Square className="h-3 w-3" /> Стоп</> : <><Play className="h-3 w-3" /> Продолжить</>}</button>
            </div>
          }
        >
          <div className="mb-3 flex items-center gap-4 text-sm">
            <span className="text-slate-400">Эпоха <span className="text-white">{epoch}/30</span></span>
            <div className="h-1.5 flex-1 rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-400 transition-all" style={{ width: `${(epoch / 30) * 100}%` }} /></div>
          </div>
          <LineChart series={[{ name: 'train loss', data: loss, color: '#60a5fa' }, { name: 'val loss', data: val, color: '#f472b6' }]} labels={loss.map((_, i) => String(i + 1))} />
        </Card>
        <Card title="Конфигурация">
          <div className="space-y-2.5 text-sm">
            {[
              ['Базовая модель', 'qwen3.5-7b'],
              ['Метод', 'LoRA r=16'],
              ['GPU', '1× A100 80GB'],
              ['Batch size', '32'],
              ['Learning rate', '2e-4'],
              ['Датасет', 'tickets.jsonl · 48K'],
              ['Стоимость', '≈ 312 ₽'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="font-mono text-slate-200">{v}</span></div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Логи" className="mt-4">
        <Code>{loss.slice(-6).map((l, i) => `[epoch ${epoch - 5 + i}] step ${(epoch - 5 + i) * 150}  loss=${l}  val_loss=${val[val.length - 6 + i] ?? ''}  lr=2.0e-04  gpu_mem=61.2GB`).join('\n')}</Code>
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="Новый запуск обучения">
        <div className="space-y-4">
          <div><label className="label">Проект</label><select className="input"><option>support-intent</option><option>churn-prediction</option></select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Тип</label><select className="input"><option>Fine-tune LLM (LoRA)</option><option>AutoML (табличные)</option><option>Свой скрипт (PyTorch)</option></select></div>
            <div><label className="label">GPU</label><select className="input"><option>1× A100 80GB</option><option>2× H100</option><option>1× RTX 4090</option></select></div>
          </div>
          <div className="flex justify-end gap-2"><button onClick={() => setModal(false)} className="btn-ghost">Отмена</button><button onClick={() => { setEpoch(1); setRunning(true); setModal(false) }} className="btn-primary">Запустить</button></div>
        </div>
      </Modal>
    </>
  )
}

export function MlRegistry() {
  const [tab, setTab] = useState<'models' | 'endpoints'>('models')
  const [copied, setCopied] = useState(false)
  return (
    <>
      <PageHeader title="Модели и деплой" subtitle="Версионированный реестр моделей и автомасштабируемые эндпоинты инференса." icon={Rocket} />
      <div className="mb-4"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'models', label: 'Реестр' }, { id: 'endpoints', label: 'Эндпоинты' }]} /></div>
      {tab === 'models' ? (
        <Card>
          <Table
            head={['Модель', 'Версия', 'Метрика', 'Фреймворк', 'Стадия', '']}
            rows={[
              ['churn-xgb', 'v7', 'AUC 0.912', 'XGBoost', <Badge tone="green">Production</Badge>, <button className="btn-ghost px-2.5 py-1 text-xs">Деплой</button>],
              ['support-intent-lora', 'v3', 'F1 0.88', 'PyTorch', <Badge tone="amber">Staging</Badge>, <button className="btn-ghost px-2.5 py-1 text-xs">Деплой</button>],
              ['demand-prophet', 'v12', 'MAPE 7.4%', 'Prophet', <Badge tone="green">Production</Badge>, <button className="btn-ghost px-2.5 py-1 text-xs">Деплой</button>],
              ['recs-two-tower', 'v2', 'NDCG 0.41', 'TensorFlow', <Badge>Archived</Badge>, <button className="btn-ghost px-2.5 py-1 text-xs">Деплой</button>],
            ]}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="churn-xgb-prod" action={<StatusDot status="running" />}>
            <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
              <div><div className="text-xs text-slate-500">RPS</div><div className="text-white">142</div></div>
              <div><div className="text-xs text-slate-500">p95</div><div className="text-white">38 мс</div></div>
              <div><div className="text-xs text-slate-500">Реплики</div><div className="text-white">2–6</div></div>
            </div>
            <div className="relative">
              <Code>{`curl -X POST https://ml.ai-studio.space/v1/churn-xgb-prod/predict \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"user_id": 1042, "features": {...}}'`}</Code>
              <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="absolute right-2 top-2 rounded-lg bg-white/5 p-1.5 text-slate-400 hover:text-white">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </Card>
          <Card title="Нагрузка, запросов/мин">
            <LineChart series={[{ name: 'rpm', data: series(24, 6000, 4000, 4), color: '#60a5fa' }]} labels={Array.from({ length: 24 }, (_, i) => `${i}:00`)} />
          </Card>
        </div>
      )}
    </>
  )
}
