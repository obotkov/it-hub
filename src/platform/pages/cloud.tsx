import { useState } from 'react'
import { HardDrive, Database, Boxes, Plus, Terminal, Square, Play, Copy } from 'lucide-react'
import { Badge, Card, Modal, PageHeader, Range, Stat, StatusDot, Table, cx } from '../../components/ui'
import { LineChart, days, series } from '../../components/charts'

const presets = [
  { n: 'Start', cpu: 1, ram: 2, disk: 30, price: 390 },
  { n: 'Basic', cpu: 2, ram: 4, disk: 60, price: 790 },
  { n: 'Standard', cpu: 4, ram: 8, disk: 120, price: 1590 },
  { n: 'Pro', cpu: 8, ram: 32, disk: 240, price: 4290 },
]

export function Vms() {
  const [vms, setVms] = useState([
    { name: 'web-01', os: 'Ubuntu 24.04', cfg: '4 vCPU · 8 GB · 120 GB', ip: '185.12.44.10', region: 'Москва', status: 'running' as 'running' | 'stopped' | 'pending', price: 1590 },
    { name: 'worker-02', os: 'Debian 12', cfg: '8 vCPU · 32 GB · 240 GB', ip: '185.12.44.27', region: 'Москва', status: 'running' as const, price: 4290 },
    { name: 'staging', os: 'Ubuntu 22.04', cfg: '2 vCPU · 4 GB · 60 GB', ip: '89.22.101.5', region: 'Санкт-Петербург', status: 'stopped' as const, price: 790 },
  ])
  const [modal, setModal] = useState(false)
  const [p, setP] = useState(1)
  const [cpu, setCpu] = useState(2)
  const [ram, setRam] = useState(4)
  const [disk, setDisk] = useState(60)
  const custom = Math.round(cpu * 250 + ram * 90 + disk * 2.5)
  return (
    <>
      <PageHeader title="Серверы и виртуальные машины" subtitle="Облачные VM на NVMe-дисках с почасовой оплатой. Готовы за 30 секунд." icon={HardDrive} actions={<button onClick={() => setModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> Создать сервер</button>} />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Серверы" value={String(vms.length)} />
        <Stat label="vCPU" value="14" />
        <Stat label="RAM" value="44 GB" />
        <Stat label="В месяц" value="6 670 ₽" />
      </div>
      <Card>
        <Table
          head={['Имя', 'ОС', 'Конфигурация', 'IP', 'Регион', 'Статус', 'Цена/мес', '']}
          rows={vms.map((v, i) => [
            <span className="font-mono font-medium text-white">{v.name}</span>,
            v.os,
            v.cfg,
            <span className="flex items-center gap-1.5 font-mono text-xs">{v.ip} <Copy className="h-3 w-3 cursor-pointer text-slate-500 hover:text-white" /></span>,
            v.region,
            <StatusDot status={v.status} />,
            `${v.price.toLocaleString('ru-RU')} ₽`,
            <div className="flex gap-1">
              <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" title="Консоль"><Terminal className="h-4 w-4" /></button>
              <button onClick={() => setVms((x) => x.map((y, j) => (j === i ? { ...y, status: y.status === 'running' ? 'stopped' : 'running' } : y)))} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
                {v.status === 'running' ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            </div>,
          ])}
        />
      </Card>
      <Card title="Загрузка CPU, %" className="mt-4">
        <LineChart labels={days(14)} series={[{ name: 'web-01', data: series(14, 30, 30, 3), color: '#818cf8' }, { name: 'worker-02', data: series(14, 50, 30, 6), color: '#22d3ee' }]} />
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="Новый сервер" wide>
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Образ</label><select className="input"><option>Ubuntu 24.04</option><option>Debian 12</option><option>Rocky Linux 9</option><option>Windows Server 2022</option><option>Docker CE</option></select></div>
            <div><label className="label">Регион</label><select className="input"><option>Москва</option><option>Санкт-Петербург</option><option>Новосибирск</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {presets.map((x, i) => (
              <button key={x.n} onClick={() => setP(i)} className={cx('rounded-xl border p-3 text-left', p === i ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/10 hover:border-white/20')}>
                <div className="text-sm font-medium text-white">{x.n}</div>
                <div className="mt-1 text-[11px] text-slate-500">{x.cpu} vCPU · {x.ram} GB</div>
                <div className="mt-2 font-mono text-xs text-slate-200">{x.price} ₽</div>
              </button>
            ))}
            <button onClick={() => setP(-1)} className={cx('rounded-xl border p-3 text-left', p === -1 ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/10 hover:border-white/20')}>
              <div className="text-sm font-medium text-white">Своя</div>
              <div className="mt-1 text-[11px] text-slate-500">конфигурация</div>
              <div className="mt-2 font-mono text-xs text-slate-200">{custom} ₽</div>
            </button>
          </div>
          {p === -1 && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Range label="vCPU" value={cpu} min={1} max={64} onChange={setCpu} />
              <Range label="RAM" value={ram} min={1} max={256} unit="GB" onChange={setRam} />
              <Range label="Диск" value={disk} min={20} max={2000} step={10} unit="GB" onChange={setDisk} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-white">{(p === -1 ? custom : presets[p].price).toLocaleString('ru-RU')} ₽/мес</span>
            <button
              onClick={() => {
                const c = p === -1 ? { cpu, ram, disk, price: custom } : presets[p]
                setVms((x) => [...x, { name: `vm-${x.length + 1}`, os: 'Ubuntu 24.04', cfg: `${c.cpu} vCPU · ${c.ram} GB · ${c.disk} GB`, ip: `185.12.44.${50 + x.length}`, region: 'Москва', status: 'pending', price: c.price }])
                setModal(false)
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

const engines = [
  { n: 'PostgreSQL', v: '17', c: 'from-sky-500 to-blue-600' },
  { n: 'ClickHouse', v: '25.3', c: 'from-yellow-400 to-amber-500' },
  { n: 'MySQL', v: '8.4', c: 'from-cyan-500 to-sky-600' },
  { n: 'Redis', v: '7.4', c: 'from-rose-500 to-red-600' },
  { n: 'MongoDB', v: '8.0', c: 'from-emerald-500 to-green-600' },
  { n: 'Kafka', v: '3.9', c: 'from-slate-400 to-slate-600' },
  { n: 'OpenSearch', v: '2.18', c: 'from-blue-500 to-indigo-600' },
  { n: 'Qdrant', v: '1.13', c: 'from-pink-500 to-rose-600' },
]

export function Databases() {
  const [dbs, setDbs] = useState([
    { name: 'main-pg', engine: 'PostgreSQL 17', cfg: '4 vCPU · 16 GB · 200 GB', hosts: '3 (HA)', status: 'running' as 'running' | 'pending' },
    { name: 'events-ch', engine: 'ClickHouse 25.3', cfg: '8 vCPU · 64 GB · 2 TB', hosts: '2 шарда', status: 'running' as const },
    { name: 'cache', engine: 'Redis 7.4', cfg: '2 vCPU · 8 GB', hosts: '1', status: 'running' as const },
  ])
  const [sel, setSel] = useState<string | null>(null)
  return (
    <>
      <PageHeader title="Управляемые базы данных" subtitle="Резервное копирование, мониторинг, обновления и отказоустойчивость — на нашей стороне." icon={Database} />
      <h3 className="mb-3 text-sm font-medium text-slate-400">Создать кластер</h3>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {engines.map((e) => (
          <button key={e.n} onClick={() => setSel(e.n)} className="card group p-4 text-left transition hover:border-white/15">
            <div className={`grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-ink-800`}><Database className="h-4 w-4 text-white" /></div>
            <div className="mt-3 text-sm font-medium text-white">{e.n}</div>
            <div className="text-xs text-slate-500">v{e.v}</div>
          </button>
        ))}
      </div>
      <Card title="Кластеры">
        <Table
          head={['Имя', 'СУБД', 'Ресурсы', 'Хосты', 'Статус', 'Бэкап']}
          rows={dbs.map((d) => [<span className="font-mono font-medium text-white">{d.name}</span>, d.engine, d.cfg, d.hosts, <StatusDot status={d.status} />, <Badge tone="green">ежедневно</Badge>])}
        />
      </Card>
      <Modal open={!!sel} onClose={() => setSel(null)} title={`Новый кластер ${sel ?? ''}`}>
        <div className="space-y-4">
          <div><label className="label">Имя кластера</label><input className="input font-mono" defaultValue={`${(sel ?? '').toLowerCase()}-1`} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Класс хоста</label><select className="input"><option>2 vCPU · 8 GB</option><option>4 vCPU · 16 GB</option><option>8 vCPU · 32 GB</option></select></div>
            <div><label className="label">Хосты</label><select className="input"><option>1</option><option>2 (реплика)</option><option>3 (HA)</option></select></div>
          </div>
          <div><label className="label">Диск</label><select className="input"><option>100 GB NVMe</option><option>500 GB NVMe</option><option>1 TB NVMe</option></select></div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setSel(null)} className="btn-ghost">Отмена</button>
            <button onClick={() => { setDbs((x) => [...x, { name: `${(sel ?? 'db').toLowerCase()}-1`, engine: sel ?? '', cfg: '2 vCPU · 8 GB · 100 GB', hosts: '1', status: 'pending' }]); setSel(null) }} className="btn-primary">Создать</button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export function K8s() {
  return (
    <>
      <PageHeader title="Kubernetes" subtitle="Управляемые кластеры с автоскейлингом, GPU-нодами и интеграцией с реестром образов." icon={Boxes} actions={<button className="btn-primary"><Plus className="h-4 w-4" /> Кластер</button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="prod-cluster" action={<StatusDot status="running" />} className="lg:col-span-2">
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
            <div><div className="text-xs text-slate-500">Версия</div><div className="text-white">v1.32</div></div>
            <div><div className="text-xs text-slate-500">Ноды</div><div className="text-white">6 / 12</div></div>
            <div><div className="text-xs text-slate-500">Поды</div><div className="text-white">148</div></div>
            <div><div className="text-xs text-slate-500">GPU-ноды</div><div className="text-white">2× H200</div></div>
          </div>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className={cx('aspect-square rounded-lg border', i < 6 ? 'border-indigo-400/40 bg-indigo-500/20' : 'border-dashed border-white/10')} title={i < 6 ? `node-${i + 1}` : 'автоскейлинг'} />
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Активные ноды и резерв автоскейлинга</p>
        </Card>
        <Card title="Группы нод">
          <div className="space-y-3 text-sm">
            {[['general', '4× 8 vCPU / 32 GB', '2–8'], ['gpu-h200', '2× H200 141GB', '0–4']].map(([n, c, a]) => (
              <div key={n} className="rounded-xl border border-white/5 bg-ink-850 p-3">
                <div className="font-mono text-white">{n}</div>
                <div className="text-xs text-slate-500">{c} · автоскейл {a}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Деплойменты" className="mt-4">
        <Table
          head={['Namespace', 'Deployment', 'Реплики', 'Образ', 'Статус']}
          rows={[
            ['prod', 'api-gateway', '6/6', 'registry.ai-studio.space/api:2.14.1', <StatusDot status="running" />],
            ['prod', 'web-frontend', '4/4', 'registry.ai-studio.space/web:5.2.0', <StatusDot status="running" />],
            ['ml', 'vllm-inference', '2/2', 'vllm/vllm-openai:latest', <StatusDot status="running" />],
            ['jobs', 'etl-nightly', '0/1', 'registry.ai-studio.space/etl:1.8', <StatusDot status="pending" />],
          ].map((r) => r.map((c, i) => (i === 3 ? <span className="font-mono text-xs">{c}</span> : c)))}
        />
      </Card>
    </>
  )
}
