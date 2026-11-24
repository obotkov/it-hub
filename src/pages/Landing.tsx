import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ShieldCheck, Building2, User, Globe2, Layers } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { sections } from '../nav'

const facts = [
  ['40+', 'сервисов в одном аккаунте'],
  ['B300 · H200 · RTX 6000', 'GPU для инференса и обучения'],
  ['99,95%', 'SLA облачной инфраструктуры'],
  ['152-ФЗ', 'данные хранятся в РФ'],
]

const steps = [
  { t: 'Создайте кабинет', d: 'Личный — для себя, или кабинет компании с реквизитами, договором и командой' },
  { t: 'Подключите сервисы', d: 'Включайте нужные продукты: от чата с LLM до кластера Kubernetes. Без отдельных договоров' },
  { t: 'Платите за использование', d: 'Единый баланс и детализация по каждому сервису. Поминутная тарификация GPU' },
]

const pricing = [
  { name: 'Старт', price: '0 ₽', note: 'для знакомства', feats: ['Чат с LLM — 50 запросов в день', 'Wildmetrics до 10K событий', '1 BI-дашборд', 'Сообщество и документация'] },
  { name: 'Pro', price: '1 990 ₽', note: 'в месяц', hot: true, feats: ['Все модели в чате без лимитов', 'Agent World и RAG Hub', 'A/B-тесты и RawData', 'GPU по минутной тарификации', 'Приоритетная поддержка'] },
  { name: 'Business', price: 'от 49 000 ₽', note: 'в месяц, для юрлиц', feats: ['Отдельные кабинеты команд', 'SSO, аудит и роли', 'Выделенные GPU и VPC', 'Договор, ЭДО, закрывающие', 'Персональный менеджер'] },
]

const wrap = 'mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8'

export default function Landing() {
  const live = sections.filter((s) => !s.soon)
  return (
    <div className="min-h-screen overflow-x-hidden bg-ink-950">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-ink-950/90 backdrop-blur">
        <div className={`${wrap} flex h-16 items-center justify-between gap-4`}>
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a href="#products" className="transition-colors hover:text-white">Продукты</a>
            <a href="#how" className="transition-colors hover:text-white">Как это работает</a>
            <a href="#business" className="transition-colors hover:text-white">Для бизнеса</a>
            <a href="#pricing" className="transition-colors hover:text-white">Тарифы</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link to="/login" className="hidden px-3 text-sm text-slate-400 transition-colors hover:text-white sm:inline">Войти</Link>
            <Link to="/login" className="btn-primary">
              <span className="hidden sm:inline">Открыть платформу</span>
              <span className="sm:hidden">Войти</span>
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="pt-28 sm:pt-40">
        <div className={wrap}>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="lg:col-span-7">
              <h1 className="inline-flex flex-col text-[48px] font-medium leading-[0.98] tracking-[-0.035em] text-white sm:text-[72px] lg:text-[88px]">
                <span className="relative z-10">Весь IT‑стек.</span>
                <span className="self-end text-slate-500">
                  Один{' '}
                  <span className="relative isolate inline-block">
                    <span aria-hidden className="absolute -bottom-[0.2em] -left-[0.04em] -right-[0.02em] -top-[0.14em] -z-10 bg-violet-500/25" />
                    хаб
                  </span>
                  <span aria-hidden className="ml-[0.06em] inline-block h-[0.17em] w-[0.17em] rounded-[0.03em] bg-violet-500 align-baseline" />
                  <span className="sr-only">.</span>
                </span>
              </h1>
            </div>
            <div className="lg:col-span-5">
              <Link to="/login" className="group mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.12] py-1 pl-1 pr-3 text-sm text-slate-300 transition-colors hover:border-white/25 hover:text-white">
                <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-300">Новое</span>
                <span className="whitespace-nowrap">Agent World<span className="hidden sm:inline"> — workflow из AI-агентов</span></span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
              </Link>
              <p className="max-w-[36rem] text-lg leading-7 text-slate-400">
                <span className="text-white">LLM, GPU, аналитика и облако на одном балансе.</span> Чат с моделями и агенты, обучение и GPU Workload, продуктовая аналитика, BI, облако и платформа данных. Один аккаунт, поминутная тарификация, кабинеты для физлиц и компаний
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/login" className="btn-primary btn-lg">
                  Начать бесплатно <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#products" className="btn-ghost btn-lg">Смотреть продукты</a>
              </div>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      {/* facts */}
      <section className="mt-20 border-y border-white/[0.06]">
        <dl className={`${wrap} grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4`}>
          {facts.map(([v, l]) => (
            <div key={l}>
              <dt className="text-xl font-medium tabular-nums text-white sm:text-2xl">{v}</dt>
              <dd className="mt-1 text-sm text-slate-500">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* products */}
      <section id="products" className={`${wrap} scroll-mt-16 py-24 lg:py-32`}>
        <SectionHead label="Продукты" title="Семь платформ, которые работают вместе">
          Данные из аналитики попадают в BI и платформу данных, модели обучаются на ML-платформе и разворачиваются на GPU, а AI-агенты используют всё это как инструменты
        </SectionHead>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {live.map((s, idx) => {
            const wide = idx === 0
            return (
              <Link
                to="/login"
                key={s.id}
                className={`group flex flex-col rounded-2xl border border-white/[0.07] bg-ink-900 p-6 transition-colors hover:border-white/[0.14] ${wide ? 'md:col-span-2' : ''}`}
              >
                <s.icon className="h-[18px] w-[18px] text-slate-400" strokeWidth={1.5} />
                <h3 className="mt-5 text-lg font-medium text-white">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{s.tagline}</p>
                <ul className={`mt-6 grid gap-x-8 gap-y-3 ${wide ? 'sm:grid-cols-2 sm:gap-y-5' : ''}`}>
                  {s.items.map((i) => (
                    <li key={i.path} className="flex items-start gap-2.5 text-sm">
                      <i.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.5} />
                      <span>
                        <span className="text-slate-200">{i.title}</span>
                        {wide && <span className="mt-0.5 block text-[13px] leading-5 text-slate-500">{i.desc}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center gap-1.5 pt-6 text-sm text-slate-400 transition-colors group-hover:text-white">
                  Попробовать <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            )
          })}
          <div className="rounded-2xl border border-dashed border-white/[0.1] p-6">
            <Layers className="h-[18px] w-[18px] text-slate-500" strokeWidth={1.5} />
            <h3 className="mt-5 text-lg font-medium text-white">В разработке</h3>
            <p className="mt-1 text-sm text-slate-400">Security Center, CI/CD, маркетплейс решений и AI-поддержка для сайтов</p>
          </div>
        </div>
      </section>

      {/* how */}
      <section id="how" className="scroll-mt-16 border-y border-white/[0.06] bg-ink-900/50 py-24 lg:py-32">
        <div className={wrap}>
          <SectionHead label="Как это работает" title="Запуск за три шага" />
          <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((s, i) => (
              <li key={s.t} className="border-t border-white/[0.1] pt-6">
                <div className="meter text-sm text-slate-500">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="mt-4 text-lg font-medium text-white">{s.t}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* business */}
      <section id="business" className={`${wrap} scroll-mt-16 py-24 lg:py-32`}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="mb-3 text-sm text-slate-500">Физлица и компании</div>
            <h2 className="text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-white sm:text-[40px]">Кабинеты для любой формы работы</h2>
            <p className="mt-4 max-w-xl text-slate-400">Переключайтесь между личным кабинетом и кабинетами компаний в один клик. У каждого — свой баланс, ресурсы и доступы</p>
            <ul className="mt-8 space-y-3">
              {['Оплата картой или по счёту', 'Договор-оферта и закрывающие документы через ЭДО', 'Роли и права для сотрудников', 'Отдельные лимиты и бюджеты по проектам'].map((f) => (
                <li key={f} className="flex items-center gap-3 text-slate-300">
                  <Check className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: User, t: 'Физическое лицо', d: 'Быстрый старт, оплата картой, персональные проекты' },
              { icon: Building2, t: 'Юридическое лицо', d: 'ИНН/КПП, счета, ЭДО, команда и аудит действий' },
              { icon: ShieldCheck, t: 'Безопасность', d: 'Шифрование, изоляция ресурсов, 2FA и SSO' },
              { icon: Globe2, t: 'Данные в РФ', d: 'Дата-центры уровня Tier III, соответствие 152-ФЗ' },
            ].map((c) => (
              <div key={c.t} className="card p-6">
                <c.icon className="h-[18px] w-[18px] text-slate-400" strokeWidth={1.5} />
                <div className="mt-5 font-medium text-white">{c.t}</div>
                <p className="mt-1 text-sm text-slate-400">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="scroll-mt-16 border-t border-white/[0.06] bg-ink-900/50 py-24 lg:py-32">
        <div className={wrap}>
          <SectionHead label="Тарифы" title="Подписка на платформы, инфраструктура по факту">
            GPU, виртуальные машины и базы данных тарифицируются отдельно — поминутно, с баланса кабинета
          </SectionHead>
          <div className="grid gap-4 lg:grid-cols-3">
            {pricing.map((p) => (
              <div key={p.name} className={`card flex flex-col p-7 ${p.hot ? 'border-violet-500/40' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-slate-300">{p.name}</span>
                  {p.hot && <span className="text-xs text-violet-400">Популярный</span>}
                </div>
                <div className="meter mt-5 text-[32px] font-medium leading-none text-white">{p.price}</div>
                <div className="mt-2 text-sm text-slate-500">{p.note}</div>
                <ul className="mt-7 flex-1 space-y-3 border-t border-white/[0.07] pt-6">
                  {p.feats.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.5} /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className={`${p.hot ? 'btn-primary' : 'btn-ghost'} mt-8 w-full`}>
                  Выбрать {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* cta */}
      <section className={`${wrap} py-24 lg:py-32`}>
        <div className="card flex flex-col gap-8 p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[28px] font-medium leading-[1.15] text-white sm:text-[32px]">Начните с тарифа Старт за <span className="meter">0 ₽</span></h2>
            <p className="mt-3 max-w-xl text-slate-400">Чат с LLM, Wildmetrics до 10K событий и BI-дашборд без оплаты. Инфраструктура — отдельно, по факту использования</p>
          </div>
          <Link to="/login" className="btn-primary btn-lg shrink-0">
            Открыть платформу <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className={`${wrap} flex flex-col gap-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between`}>
          <Logo />
          <span>© {new Date().getFullYear()} IT Hub · хаб IT-сервисов · данные хранятся в РФ</span>
        </div>
      </footer>
    </div>
  )
}

function SectionHead({ label, title, children }: { label: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-12 max-w-2xl lg:mb-16">
      <div className="mb-3 text-sm text-slate-500">{label}</div>
      <h2 className="text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-white sm:text-[40px]">{title}</h2>
      {children && <p className="mt-4 text-slate-400">{children}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hero product view: the one rich moment on the page                  */
/* ------------------------------------------------------------------ */

// GPU utilisation of a 2× B300 vLLM pod over the last 24 hours, % (plausible daily curve)
const util = [38, 34, 31, 29, 28, 30, 36, 47, 58, 66, 71, 74, 76, 73, 75, 79, 82, 80, 77, 73, 70, 67, 65, 64]
// requests per second, scaled to the same 0–100 axis for the comparison line
const rps = [22, 19, 17, 15, 15, 17, 22, 31, 40, 47, 52, 55, 57, 54, 56, 60, 63, 61, 58, 54, 51, 48, 46, 45]

const spend = [
  { k: 'GPU Workload', v: 3536 },
  { k: 'AI Platform', v: 2358 },
  { k: 'Облако', v: 1516 },
  { k: 'Аналитика', v: 1010 },
]

function smooth(data: number[], w: number, h: number, pad = 4) {
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, pad + (h - pad * 2) * (1 - v / 100)] as const)
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[Math.max(i - 1, 0)]
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const [x3, y3] = pts[Math.min(i + 2, pts.length - 1)]
    const c1x = x1 + (x2 - x0) / 6
    const c1y = y1 + (y2 - y0) / 6
    const c2x = x2 - (x3 - x1) / 6
    const c2y = y2 - (y3 - y1) / 6
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`
  }
  return { d, last: pts[pts.length - 1] }
}

function ProductPreview() {
  const W = 640
  const H = 200
  const u = smooth(util, W, H)
  const r = smooth(rps, W, H)
  const max = spend[0].v
  const nav = sections.filter((s) => !s.soon)
  return (
    <div className="preview-window mt-16 overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900">
      <div className="flex h-10 items-center gap-1.5 border-b border-white/[0.06] px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
        <span className="meter ml-3 text-xs text-slate-500">ai-studio.space/app/gpu/pods</span>
      </div>
      <div className="flex">
        <div className="hidden w-52 shrink-0 space-y-0.5 border-r border-white/[0.06] p-3 md:block">
          {nav.map((s) => {
            const on = s.id === 'gpu'
            return (
              <div key={s.id} className={`flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] ${on ? 'bg-ink-800 text-white' : 'text-slate-400'}`}>
                <s.icon className={`h-4 w-4 shrink-0 ${on ? 'text-violet-400' : 'text-slate-500'}`} strokeWidth={1.5} />
                <span className="truncate">{s.title}</span>
              </div>
            )
          })}
        </div>

        <div className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[13px] text-slate-500">GPU-поды</div>
              <div className="mt-1 text-xl font-medium text-white">llama-70b-prod</div>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Работает · 2× B300 288GB · vLLM
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {/* main chart */}
            <div className="rounded-xl border border-white/[0.06] bg-ink-950/60 p-4 sm:p-5 lg:col-span-2">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <div className="text-[13px] text-slate-400">Утилизация GPU за 24 часа</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[28px] font-medium leading-none tabular-nums text-white">64%</span>
                    <span className="text-xs text-slate-500">сейчас · пик 82% в 16:00</span>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-violet-500" /> Утилизация</span>
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-slate-500" /> Запросы в секунду</span>
                </div>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-5 h-[160px] w-full sm:h-[200px]" aria-label="График утилизации GPU">
                {[0, 25, 50, 75, 100].map((t) => {
                  const y = 4 + (H - 8) * (1 - t / 100)
                  return <line key={t} x1="0" x2={W} y1={y} y2={y} className="stroke-white/[0.06]" strokeDasharray={t === 0 ? undefined : '2 4'} vectorEffect="non-scaling-stroke" />
                })}
                <path d={`${u.d} L${W},${H} L0,${H} Z`} className="fill-violet-500/[0.06]" />
                <path d={r.d} fill="none" className="stroke-slate-500" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                <path d={u.d} fill="none" className="stroke-violet-500" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="meter mt-2 flex justify-between text-[11px] text-slate-500">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>сейчас</span>
              </div>
            </div>

            {/* balance meter */}
            <div className="rounded-xl border border-white/[0.06] bg-ink-950/60 p-4 sm:p-5">
              <div className="text-[13px] text-slate-400">Баланс кабинета</div>
              <div className="meter mt-2 whitespace-nowrap text-[24px] font-medium leading-none text-white xl:text-[28px]">12 450,00 ₽</div>
              <div className="meter mt-2 text-xs text-slate-500">−0,84 ₽/мин · списание поминутно</div>
              <div className="mt-6 border-t border-white/[0.06] pt-4">
                <div className="mb-3 flex justify-between text-xs text-slate-500">
                  <span>Расход за ноябрь</span>
                  <span className="meter">8 420 ₽</span>
                </div>
                <ul className="space-y-3">
                  {spend.map((s, i) => (
                    <li key={s.k}>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-300">{s.k}</span>
                        <span className="meter text-slate-400">{s.v.toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <div className="mt-1.5 h-1 rounded-full bg-white/[0.06]">
                        <div className={`h-full rounded-full ${i === 0 ? 'bg-violet-500' : 'bg-slate-600'}`} style={{ width: `${(s.v / max) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
