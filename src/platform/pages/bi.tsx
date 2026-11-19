import { useState } from 'react'
import { DatabaseZap, Plus, Upload, BellRing, Database, FileSpreadsheet, Mail, MessageSquare, Send } from 'lucide-react'
import { Badge, Card, Modal, PageHeader, StatusDot, Table, Toggle, cx } from '../../components/ui'

const sourceTypes = [
  { n: 'PostgreSQL', c: '#60a5fa' }, { n: 'ClickHouse', c: '#facc15' }, { n: 'MySQL', c: '#38bdf8' }, { n: 'BigQuery', c: '#4ade80' },
  { n: 'Greenplum', c: '#34d399' }, { n: 'Wildmetrics', c: '#fb923c' }, { n: 'Google Sheets', c: '#22c55e' }, { n: 'CSV / Excel', c: '#a78bfa' },
]

export function BiSources() {
  const [modal, setModal] = useState(false)
  const [sources, setSources] = useState([
    { name: 'prod-postgres', type: 'PostgreSQL', tables: 84, status: 'running' as const, sync: '2 мин назад' },
    { name: 'events-ch', type: 'ClickHouse', tables: 12, status: 'running' as const, sync: 'live' },
    { name: 'wildmetrics', type: 'Wildmetrics', tables: 6, status: 'running' as const, sync: '5 мин назад' },
    { name: 'budget_2026.xlsx', type: 'CSV / Excel', tables: 3, status: 'stopped' as const, sync: 'загружен 12.11' },
  ])
  const [picked, setPicked] = useState('PostgreSQL')
  return (
    <>
      <PageHeader title="Источники данных" subtitle="Подключайте базы данных и загружайте файлы — всё становится доступно для запросов и дашбордов." icon={DatabaseZap} actions={<button onClick={() => setModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> Добавить источник</button>} />
      <Card>
        <Table
          head={['Источник', 'Тип', 'Таблиц', 'Статус', 'Синхронизация']}
          rows={sources.map((s) => [
            <span className="flex items-center gap-2 font-medium text-white">{s.type === 'CSV / Excel' ? <FileSpreadsheet className="h-4 w-4 text-violet-300" /> : <Database className="h-4 w-4 text-cyan-300" />}{s.name}</span>,
            s.type,
            s.tables,
            <StatusDot status={s.status} />,
            s.sync,
          ])}
        />
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="Новый источник" wide>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {sourceTypes.map((t) => (
            <button key={t.n} onClick={() => setPicked(t.n)} className={cx('rounded-xl border p-3 text-left text-sm transition', picked === t.n ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-white/10 hover:border-white/20')}>
              <span className="mb-2 block h-2 w-6 rounded-full" style={{ background: t.c }} />
              {t.n}
            </button>
          ))}
        </div>
        {picked === 'CSV / Excel' || picked === 'Google Sheets' ? (
          <label className="mt-5 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 p-8 text-sm text-slate-400 hover:border-cyan-500/50">
            <Upload className="h-6 w-6" /> Загрузите файл CSV, XLSX или вставьте ссылку на таблицу
            <input type="file" hidden />
          </label>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div><label className="label">Хост</label><input className="input font-mono" placeholder="db.example.ru" /></div>
            <div><label className="label">Порт</label><input className="input font-mono" placeholder={picked === 'ClickHouse' ? '8443' : '5432'} /></div>
            <div><label className="label">База</label><input className="input font-mono" placeholder="analytics" /></div>
            <div><label className="label">Пользователь</label><input className="input font-mono" placeholder="readonly" /></div>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setModal(false)} className="btn-ghost">Отмена</button>
          <button
            onClick={() => {
              setSources((s) => [...s, { name: `new-${picked.toLowerCase().replace(/\W/g, '')}`, type: picked, tables: 0, status: 'running', sync: 'только что' }])
              setModal(false)
            }}
            className="btn-primary"
          >
            Подключить
          </button>
        </div>
      </Modal>
    </>
  )
}

export function BiAlerts() {
  const [alerts, setAlerts] = useState([
    { name: 'Падение выручки > 20%', cond: 'revenue_day < avg_7d × 0.8', ch: 'Telegram', on: true, last: 'не срабатывал' },
    { name: 'Ошибки оплаты', cond: 'payment_errors > 50 / час', ch: 'Slack', on: true, last: '14.11 03:12' },
    { name: 'Еженедельный отчёт', cond: 'каждый пн 09:00', ch: 'Email', on: true, last: '17.11 09:00' },
    { name: 'Рост отказов', cond: 'bounce_rate > 45%', ch: 'Email', on: false, last: '—' },
  ])
  const [modal, setModal] = useState(false)
  const icon = (c: string) => (c === 'Email' ? <Mail className="h-4 w-4" /> : c === 'Slack' ? <MessageSquare className="h-4 w-4" /> : <Send className="h-4 w-4" />)
  return (
    <>
      <PageHeader title="Алерты и уведомления" subtitle="Получайте уведомления, когда метрики выходят за пороги, и отчёты по расписанию." icon={BellRing} actions={<button onClick={() => setModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> Алерт</button>} />
      <div className="space-y-3">
        {alerts.map((a, i) => (
          <div key={a.name} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="font-medium text-white">{a.name}</div>
              <div className="mt-0.5 font-mono text-xs text-slate-500">{a.cond}</div>
            </div>
            <Badge tone="cyan">{icon(a.ch)} {a.ch}</Badge>
            <span className="w-36 text-xs text-slate-500">Последний: {a.last}</span>
            <Toggle on={a.on} onChange={(v) => setAlerts((x) => x.map((y, j) => (j === i ? { ...y, on: v } : y)))} />
          </div>
        ))}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Новый алерт">
        <div className="space-y-4">
          <div><label className="label">Название</label><input className="input" placeholder="Например: аномалия трафика" /></div>
          <div className="grid grid-cols-3 gap-2">
            <select className="input"><option>revenue</option><option>orders</option><option>visits</option></select>
            <select className="input"><option>&lt;</option><option>&gt;</option><option>изменение %</option></select>
            <input className="input" placeholder="1000" />
          </div>
          <div><label className="label">Канал</label><select className="input"><option>Telegram</option><option>Email</option><option>Slack</option><option>Webhook</option></select></div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(false)} className="btn-ghost">Отмена</button>
            <button onClick={() => { setAlerts((x) => [...x, { name: 'Новый алерт', cond: 'revenue < 1000', ch: 'Telegram', on: true, last: '—' }]); setModal(false) }} className="btn-primary">Создать</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
