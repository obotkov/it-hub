import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Building2, CreditCard, FileText, Hammer, Plus, Receipt, User, Wallet, Activity, Server, Gauge, MessageSquare } from 'lucide-react'
import { sections, findItem } from '../../nav'
import { useAccount } from '../../account'
import { Badge, Card, PageHeader, Stat, Table, cx } from '../../components/ui'
import { BarChart, Donut, LineChart, days, series } from '../../components/charts'
import CabinetModal from '../CabinetModal'

export function Overview() {
  const { current } = useAccount()
  const month = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '')
  return (
    <>
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[28px] font-medium leading-tight text-white">Обзор · {month}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {current.name} · {current.type === 'legal' ? 'юридическое лицо' : 'физическое лицо'} · баланс <span className="meter text-slate-200">{current.balance.toLocaleString('ru-RU')} ₽</span>
          </p>
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            <Link to="/app/ai/chat" className="btn-primary"><MessageSquare className="h-4 w-4" /> Новый чат</Link>
            <Link to="/app/gpu/deploy" className="btn-ghost"><Server className="h-4 w-4" /> Запустить GPU-под</Link>
            <Link to="/app/analytics/counters" className="btn-ghost"><Gauge className="h-4 w-4" /> Создать счётчик</Link>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Расходы за месяц" value="8 420 ₽" delta="+6% к прошлому месяцу" />
        <Stat label="Токенов LLM" value="2,4 млн" delta="+18% к прошлому месяцу" />
        <Stat label="GPU-часов" value="37,5" delta="−4% к прошлому месяцу" />
        <Stat label="Событий аналитики" value="1,2 млн" delta="+12% к прошлому месяцу" />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card title="Расходы по дням" className="lg:col-span-2">
          <LineChart labels={days(30)} series={[{ name: 'Расходы, ₽', data: series(30, 180, 160, 7), color: '#8b5cf6' }]} />
        </Card>
        <Card title="Структура расходов">
          <Donut
            data={[
              { label: 'GPU', value: 42, color: '#8b5cf6' },
              { label: 'AI Platform', value: 28, color: '#8e8e93' },
              { label: 'Облако', value: 18, color: '#5c5c61' },
              { label: 'Аналитика', value: 12, color: '#3a3a3e' },
            ]}
          />
        </Card>
      </div>

      <h2 className="mb-4 text-lg font-medium text-white">Платформы</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sections.filter((s) => !s.soon).map((s) => (
          <Link key={s.id} to={`/app/${s.items[0].path}`} className="card group p-5 transition-colors hover:border-white/15">
            <s.icon className="mb-4 h-[18px] w-[18px] text-slate-400" strokeWidth={1.5} />
            <div className="font-medium text-white">{s.title}</div>
            <p className="mt-1 text-sm text-slate-400">{s.tagline}</p>
            <div className="mt-4 flex items-center gap-1 text-xs text-slate-500 group-hover:text-slate-300">
              {s.items.length} сервисов <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

export function Soon() {
  const loc = useLocation()
  const f = findItem(loc.pathname)
  const Icon = f?.item.icon ?? Hammer
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.08] bg-ink-850">
        <Icon className="h-6 w-6 text-slate-400" strokeWidth={1.5} />
      </div>
      <Badge tone="amber">В разработке</Badge>
      <h1 className="mt-3 text-3xl font-medium text-white">{f?.item.title ?? 'Скоро'}</h1>
      <p className="mt-2 max-w-md text-slate-400">{f?.item.desc}. Мы уже работаем над этим блоком — оставьте заявку, и мы сообщим о запуске</p>
      <button className="btn-primary mt-6">Хочу ранний доступ</button>
    </div>
  )
}

export function Cabinets() {
  const { cabinets, current, setCurrent } = useAccount()
  const [modal, setModal] = useState(false)
  return (
    <>
      <PageHeader
        title="Кабинеты"
        subtitle="Создавайте кабинеты для себя и для компаний. У каждого кабинета свой баланс, ресурсы и участники."
        icon={Building2}
        actions={<button onClick={() => setModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> Создать кабинет</button>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cabinets.map((c) => (
          <div key={c.id} className={cx('card p-5', c.id === current.id && 'border-violet-500/40')}>
            <div className="flex items-start justify-between">
              <span className={cx('grid h-11 w-11 place-items-center rounded-xl', c.type === 'legal' ? 'bg-violet-500/20 text-violet-300' : 'bg-cyan-500/20 text-cyan-300')}>
                {c.type === 'legal' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </span>
              {c.id === current.id ? <Badge tone="violet">Активный</Badge> : <button onClick={() => setCurrent(c.id)} className="text-xs text-slate-400 hover:text-white">Переключиться</button>}
            </div>
            <div className="mt-4 text-lg font-medium text-white">{c.name}</div>
            <div className="text-sm text-slate-500">{c.type === 'legal' ? 'Юридическое лицо' : 'Физическое лицо'}</div>
            <div className="mt-4 space-y-2 border-t border-white/5 pt-4 text-sm">
              {c.type === 'legal' && (
                <>
                  <Row k="ИНН" v={c.inn ?? '—'} />
                  <Row k="КПП" v={c.kpp ?? '—'} />
                  <Row k="Документооборот" v="ЭДО (Диадок)" />
                </>
              )}
              <Row k="Баланс" v={`${c.balance.toLocaleString('ru-RU')} ₽`} />
              <Row k="Участники" v={c.type === 'legal' ? '1 из 50' : '1'} />
            </div>
          </div>
        ))}
        <button onClick={() => setModal(true)} className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 text-slate-400 transition hover:border-white/25 hover:text-white">
          <Plus className="h-6 w-6" /> Новый кабинет
        </button>
      </div>
      <CabinetModal open={modal} onClose={() => setModal(false)} />
    </>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{k}</span>
      <span className="font-mono text-slate-200">{v}</span>
    </div>
  )
}

export function Billing() {
  const { current } = useAccount()
  return (
    <>
      <PageHeader title="Баланс и платежи" subtitle={`Кабинет «${current.name}»`} icon={Wallet} actions={<button className="btn-primary"><CreditCard className="h-4 w-4" /> Пополнить</button>} />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Stat label="Баланс" value={`${current.balance.toLocaleString('ru-RU')} ₽`} icon={Wallet} />
        <Stat label="Списано за месяц" value="8 420 ₽" icon={Receipt} />
        <Stat label="Прогноз на месяц" value="11 900 ₽" icon={Activity} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Расходы по сервисам" className="lg:col-span-2">
          <BarChart
            data={[
              { label: 'GPU', value: 3540 },
              { label: 'LLM', value: 2360 },
              { label: 'VM', value: 1100 },
              { label: 'БД', value: 420 },
              { label: 'Аналит.', value: 610 },
              { label: 'BI', value: 390 },
            ]}
          />
        </Card>
        <Card title="Способы оплаты">
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 p-3">
              <CreditCard className="h-5 w-5 text-slate-400" />
              <span className="text-sm">Карта •••• 4242</span>
              <Badge tone="green">Основная</Badge>
            </div>
            {current.type === 'legal' && (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 p-3">
                <FileText className="h-5 w-5 text-slate-400" />
                <span className="text-sm">Оплата по счёту</span>
              </div>
            )}
          </div>
        </Card>
      </div>
      <Card title="Операции" className="mt-4">
        <Table
          head={['Дата', 'Сервис', 'Описание', 'Сумма']}
          rows={[
            ['18.11.2026', 'GPU', 'Под vllm-llama · 2× H200 · 3 ч', '−2 694 ₽'],
            ['17.11.2026', 'AI Platform', 'Токены Claude Opus 5.5', '−412 ₽'],
            ['16.11.2026', 'Пополнение', 'Карта •••• 4242', <span className="text-emerald-400">+10 000 ₽</span>],
            ['15.11.2026', 'Облако', 'VM web-01 · месяц', '−1 100 ₽'],
          ]}
        />
      </Card>
    </>
  )
}
