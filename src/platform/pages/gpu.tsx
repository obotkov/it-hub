import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Rocket, Server, Check, Cpu, MemoryStick, HardDrive, Terminal, ExternalLink, Square, Play, Trash2, Search, Plus, Workflow, Flame, Zap, Bot, MessageSquare, Image, BookOpen, Mic, Box } from 'lucide-react'
import { Badge, Card, Empty, PageHeader, Range, StatusDot, cx } from '../../components/ui'

const templates = [
  { id: 'comfyui', name: 'ComfyUI', desc: 'Генерация изображений и видео на нодах', img: Workflow, tag: 'Популярный', port: 8188 },
  { id: 'pytorch', name: 'PyTorch 2.6', desc: 'CUDA 12.8 + JupyterLab', img: Flame, port: 8888 },
  { id: 'vllm', name: 'vLLM', desc: 'Быстрый OpenAI-совместимый LLM-сервер', img: Zap, tag: 'LLM', port: 8000 },
  { id: 'ollama', name: 'Ollama', desc: 'NVIDIA CUDA · локальные LLM в один клик', img: Bot, port: 11434 },
  { id: 'ubuntu', name: 'Ubuntu 24.04', desc: 'Чистая система с CUDA-драйверами', img: Terminal, port: 22 },
  { id: 'tgi', name: 'Text Generation Inference', desc: 'HF TGI для продакшн-инференса', img: MessageSquare, port: 8080 },
  { id: 'sd-webui', name: 'Stable Diffusion WebUI', desc: 'Forge / A1111 интерфейс', img: Image, port: 7860 },
  { id: 'jupyter', name: 'TensorFlow + Jupyter', desc: 'TF 2.18 и ноутбуки', img: BookOpen, port: 8888 },
  { id: 'whisper', name: 'Whisper API', desc: 'Распознавание речи faster-whisper', img: Mic, port: 9000 },
  { id: 'custom', name: 'Свой образ', desc: 'Любой Docker-образ из реестра', img: Box, port: 0 },
]

const gpus = [
  { id: 'none', name: 'Без GPU', vram: 0, price: 0, avail: 'много' },
  { id: 'rtx6000', name: 'RTX 6000 96GB', vram: 96, price: 129, avail: 'много' },
  { id: 'h200', name: 'H200 141GB', vram: 141, price: 449, avail: 'есть' },
  { id: 'b300', name: 'B300 288GB', vram: 288, price: 799, avail: 'мало' },
]

const oses = ['Ubuntu 24.04', 'Ubuntu 22.04', 'Debian 12', 'Rocky Linux 9', 'Windows Server 2022']

export type Pod = { id: string; name: string; tpl: string; gpu: string; count: number; cpu: number; ram: number; disk: number; status: 'running' | 'stopped' | 'pending'; price: number; uptime: string }

const initialPods: Pod[] = [
  { id: 'p1', name: 'vllm-qwen-72b', tpl: 'vLLM', gpu: 'H200 141GB', count: 2, cpu: 32, ram: 256, disk: 500, status: 'running', price: 982, uptime: '3 ч 12 мин' },
  { id: 'p2', name: 'comfy-flux', tpl: 'ComfyUI', gpu: 'RTX 6000 96GB', count: 1, cpu: 8, ram: 48, disk: 120, status: 'running', price: 147, uptime: '47 мин' },
  { id: 'p3', name: 'jupyter-exp', tpl: 'PyTorch 2.6', gpu: 'B300 288GB', count: 1, cpu: 16, ram: 128, disk: 200, status: 'stopped', price: 0, uptime: '—' },
]

const loadPods = (): Pod[] => {
  try {
    return JSON.parse(localStorage.getItem('hub.pods.v2') || 'null') ?? initialPods
  } catch {
    return initialPods
  }
}
const savePods = (p: Pod[]) => {
  try {
    localStorage.setItem('hub.pods.v2', JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

export function GpuDeploy() {
  const nav = useNavigate()
  const [tpl, setTpl] = useState('vllm')
  const [q, setQ] = useState('')
  const [gpu, setGpu] = useState('h200')
  const [count, setCount] = useState(1)
  const [cpu, setCpu] = useState(16)
  const [ram, setRam] = useState(64)
  const [disk, setDisk] = useState(100)
  const [os, setOs] = useState(oses[0])
  const [name, setName] = useState('')
  const [spot, setSpot] = useState(false)

  const g = gpus.find((x) => x.id === gpu)!
  const gpuCount = g.id === 'none' ? 0 : count
  const hourly = Math.round((g.price * gpuCount + cpu * 1.2 + ram * 0.25 + disk * 0.02) * (spot ? 0.6 : 1))
  const t = templates.find((x) => x.id === tpl)!

  const deploy = () => {
    const pods = loadPods()
    pods.unshift({
      id: 'p' + Date.now(),
      name: name || `${t.id}-${Math.random().toString(36).slice(2, 6)}`,
      tpl: t.name,
      gpu: g.name,
      count: gpuCount,
      cpu,
      ram,
      disk,
      status: 'pending',
      price: hourly,
      uptime: 'только что',
    })
    savePods(pods)
    nav('/app/gpu/pods')
  }

  return (
    <>
      <PageHeader title="Новый GPU-под" subtitle="Выберите шаблон и конфигурацию — под запустится за ~60 секунд. Поминутная тарификация." icon={Rocket} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="1. Шаблон пода" action={<div className="relative"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><input className="input w-48 py-1.5 pl-8 text-xs" placeholder="Поиск шаблона" value={q} onChange={(e) => setQ(e.target.value)} /></div>}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates.filter((x) => x.name.toLowerCase().includes(q.toLowerCase())).map((x) => (
                <button key={x.id} onClick={() => setTpl(x.id)} className={cx('relative rounded-2xl border p-4 text-left transition', tpl === x.id ? 'border-emerald-400/60 bg-emerald-500/[0.07]' : 'border-white/[0.06] bg-ink-850 hover:border-white/15')}>
                  <div className="flex items-start justify-between">
                    <x.img className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
                    {tpl === x.id ? <span className="on-accent grid h-5 w-5 place-items-center rounded-full bg-emerald-500"><Check className="h-3 w-3 text-white" /></span> : x.tag && <Badge tone="green">{x.tag}</Badge>}
                  </div>
                  <div className="mt-3 text-sm font-medium text-white">{x.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{x.desc}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card title="2. GPU">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gpus.map((x) => (
                <button key={x.id} onClick={() => setGpu(x.id)} className={cx('rounded-2xl border p-4 text-left transition', gpu === x.id ? 'border-emerald-400/60 bg-emerald-500/[0.07]' : 'border-white/[0.06] bg-ink-850 hover:border-white/15')}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{x.name}</span>
                    <span className={cx('text-[10px]', x.avail === 'мало' ? 'text-amber-400' : 'text-emerald-400')}>● {x.avail}</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">{x.vram ? `${x.vram} GB VRAM` : 'только CPU'}</span>
                    <span className="font-mono text-sm text-slate-200">{x.price} ₽/ч</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card title="3. Вычисления (Compute)">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="label">Операционная система</label>
                <select className="input" value={os} onChange={(e) => setOs(e.target.value)}>{oses.map((o) => <option key={o}>{o}</option>)}</select>
              </div>
              <div>
                <label className="label">Имя пода</label>
                <input className="input" placeholder={`${t.id}-pod`} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <Range label="Количество GPU" value={gpuCount} min={g.id === 'none' ? 0 : 1} max={g.id === 'none' ? 0 : 8} unit="шт" onChange={setCount} />
              <Range label="vCPU" value={cpu} min={2} max={128} step={2} unit="ядер" onChange={setCpu} />
              <Range label="RAM" value={ram} min={8} max={1024} step={8} unit="GB" onChange={setRam} />
              <Range label="Диск (ROM)" value={disk} min={20} max={4000} step={20} unit="GB" onChange={setDisk} />
            </div>
            <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-850 p-3">
              <input type="checkbox" checked={spot} onChange={(e) => setSpot(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
              <span className="text-sm"><span className="text-white">Spot-инстанс</span> <span className="text-slate-500">— скидка 40%, под может быть прерван</span></span>
            </label>
          </Card>
        </div>

        <div className="xl:sticky xl:top-0 xl:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-white/[0.07] bg-ink-850 p-5">
              <div className="text-xs text-slate-400">Итого</div>
              <div className="meter mt-1 text-[32px] font-medium leading-tight text-white">{hourly} ₽<span className="text-base font-normal text-slate-400">/час</span></div>
              <div className="meter mt-1 text-xs text-slate-400">≈ {(hourly * 24 * 30).toLocaleString('ru-RU')} ₽ в месяц при 24/7</div>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <Line icon={<t.img className="h-4 w-4" />} k="Шаблон" v={t.name} />
              <Line icon={<Server className="h-4 w-4" />} k="GPU" v={gpuCount ? `${gpuCount}× ${g.name}` : 'нет'} />
              <Line icon={<Cpu className="h-4 w-4" />} k="vCPU" v={`${cpu}`} />
              <Line icon={<MemoryStick className="h-4 w-4" />} k="RAM" v={`${ram} GB`} />
              <Line icon={<HardDrive className="h-4 w-4" />} k="Диск" v={`${disk} GB NVMe`} />
              <Line icon={<Terminal className="h-4 w-4" />} k="ОС" v={os} />
              <button onClick={deploy} className="btn-primary btn-lg mt-2 w-full">
                <Rocket className="h-4 w-4" /> Запустить под
              </button>
              <p className="text-center text-xs text-slate-500">Оплата поминутно с баланса кабинета</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Line({ icon, k, v }: { icon: ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-slate-400">{icon}</span>
      <span className="text-slate-500">{k}</span>
      <span className="ml-auto text-right text-slate-200">{v}</span>
    </div>
  )
}

export function GpuPods() {
  const nav = useNavigate()
  const [pods, setPodsState] = useState<Pod[]>(loadPods)
  useEffect(() => {
    // finish "pending" pods after a moment
    const t = setTimeout(() => {
      const upd = loadPods().map((x) => (x.status === 'pending' ? { ...x, status: 'running' as const } : x))
      savePods(upd)
      setPodsState(upd)
    }, 2500)
    return () => clearTimeout(t)
  }, [])
  const setPods = (f: (p: Pod[]) => Pod[]) =>
    setPodsState((p) => {
      const n = f(p)
      savePods(n)
      return n
    })

  const total = pods.filter((p) => p.status === 'running').reduce((a, p) => a + p.price, 0)

  return (
    <>
      <PageHeader title="Мои поды" subtitle={`Запущено: ${pods.filter((p) => p.status === 'running').length} · расход ${total} ₽/час`} icon={Server} actions={<button onClick={() => nav('/app/gpu/deploy')} className="btn-primary"><Plus className="h-4 w-4" /> Новый под</button>} />
      {pods.length === 0 ? (
        <Empty icon={Server} title="Нет подов" text="Запустите первый под с GPU — это займёт около минуты." action={<button onClick={() => nav('/app/gpu/deploy')} className="btn-primary">Создать под</button>} />
      ) : (
        <div className="space-y-3">
          {pods.map((p) => (
            <div key={p.id} className="card flex flex-col gap-4 p-5 xl:flex-row xl:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4 xl:min-w-[18rem]">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10"><Server className="h-5 w-5 text-emerald-300" /></div>
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm font-medium text-white">{p.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{p.tpl} · {p.count ? `${p.count}× ${p.gpu}` : 'CPU'} · {p.cpu} vCPU · {p.ram} GB RAM · {p.disk} GB</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <StatusDot status={p.status} />
                <span className="text-slate-400">⏱ {p.uptime}</span>
                <span className="font-mono text-slate-200">{p.status === 'running' ? `${p.price} ₽/ч` : '—'}</span>
                {p.status === 'running' && (
                  <div className="hidden w-28 md:block">
                    <div className="mb-1 flex justify-between text-[10px] text-slate-500"><span>GPU</span><span>{40 + (p.name.length * 7) % 55}%</span></div>
                    <div className="h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${40 + (p.name.length * 7) % 55}%` }} /></div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button disabled={p.status !== 'running'} className="btn-ghost px-3 py-1.5 text-xs"><ExternalLink className="h-3.5 w-3.5" /> Подключиться</button>
                <button
                  onClick={() => setPods((ps) => ps.map((x) => (x.id === p.id ? { ...x, status: x.status === 'running' ? 'stopped' : 'running', uptime: x.status === 'running' ? '—' : 'только что' } : x)))}
                  className="btn-ghost px-2.5 py-1.5"
                  title={p.status === 'running' ? 'Остановить' : 'Запустить'}
                >
                  {p.status === 'running' ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => setPods((ps) => ps.filter((x) => x.id !== p.id))} className="btn-ghost px-2.5 py-1.5 text-rose-300" title="Удалить">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
