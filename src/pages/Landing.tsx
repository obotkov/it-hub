import { Link } from 'react-router-dom'
import { ArrowRight, Check, Zap, ShieldCheck, Building2, User, Globe2, Layers, Terminal, ChevronRight } from 'lucide-react'
import Logo from '../components/Logo'
import { sections } from '../nav'
import { LineChart, series } from '../components/charts'

const stats = [
  ['40+', 'сервисов в одном аккаунте'],
  ['A100 · H100 · RTX 4090', 'GPU для инференса и обучения'],
  ['99.95%', 'SLA облачной инфраструктуры'],
  ['152-ФЗ', 'данные хранятся в РФ'],
]

const pricing = [
  { name: 'Старт', price: '0 ₽', note: 'для знакомства', feats: ['Чат с LLM — 50 запросов/день', 'Wildmetrics до 10K событий', '1 BI-дашборд', 'Сообщество и документация'] },
  { name: 'Pro', price: '2 990 ₽', note: 'в месяц', hot: true, feats: ['Все модели в чате без лимитов', 'Agent World и RAG Hub', 'A/B-тесты и RawData', 'GPU по минутной тарификации', 'Приоритетная поддержка'] },
  { name: 'Business', price: 'от 49 000 ₽', note: 'в месяц, для юрлиц', feats: ['Отдельные кабинеты команд', 'SSO, аудит и роли', 'Выделенные GPU и VPC', 'Договор, ЭДО, закрывающие', 'Персональный менеджер'] },
]

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-ink-950">
      {/* nav */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.05] bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a href="#products" className="hover:text-white">Продукты</a>
            <a href="#how" className="hover:text-white">Как это работает</a>
            <a href="#business" className="hover:text-white">Для бизнеса</a>
            <a href="#pricing" className="hover:text-white">Тарифы</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn hidden text-slate-300 hover:text-white sm:inline-flex">Войти</Link>
            <Link to="/login" className="btn-primary">
              Открыть платформу <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative pt-32 pb-20 sm:pt-40">
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-40 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
            <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-semibold text-white">NEW</span>
            Agent World — собирайте AI-агентов в визуальные workflow
            <ChevronRight className="h-3 w-3" />
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Все IT-сервисы для&nbsp;роста <span className="text-gradient animate-shimmer bg-[length:200%_auto]">в одном хабе</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            AI и ML платформы, GPU-инференс, продуктовая аналитика, BI, облако и платформа данных. Один аккаунт, единый биллинг, кабинеты для физлиц и компаний.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/login" className="btn-primary px-6 py-3 text-base">
              Начать бесплатно <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#products" className="btn-ghost px-6 py-3 text-base">Смотреть продукты</a>
          </div>

          {/* hero mock */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-violet-500/40 via-white/5 to-transparent" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-900 text-left shadow-2xl shadow-violet-950/50">
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-rose-500/70" />
                <span className="h-3 w-3 rounded-full bg-amber-500/70" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
                <span className="ml-3 rounded-md bg-white/5 px-3 py-0.5 font-mono text-xs text-slate-500">ai-studio.space/app</span>
              </div>
              <div className="flex">
                <div className="hidden w-52 shrink-0 space-y-1 border-r border-white/5 p-3 sm:block">
                  {sections.slice(0, 7).map((s, i) => (
                    <div key={s.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${i === 0 ? 'bg-white/10 text-white' : 'text-slate-400'}`}>
                      <s.icon className="h-3.5 w-3.5" /> {s.title}
                    </div>
                  ))}
                </div>
                <div className="grid flex-1 gap-3 p-4 md:grid-cols-3">
                  <div className="space-y-3 rounded-xl border border-white/5 bg-ink-850 p-4 md:col-span-2">
                    <div className="text-xs text-slate-500">Чат · Claude Opus 5.5</div>
                    <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-violet-600/80 px-3 py-2 text-xs text-white">Сравни конверсию воронки за неделю и предложи гипотезы для A/B</div>
                    <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-white/5 px-3 py-2 text-xs text-slate-300">
                      Конверсия «корзина → оплата» снизилась на 4.2%. Основная просадка — мобильный Safari. Предлагаю 3 гипотезы…
                    </div>
                    <div className="rounded-lg bg-ink-950 p-2">
                      <LineChart height={90} series={[{ name: 'CR', data: series(20, 40, 18, 3), color: '#a78bfa' }]} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/5 bg-ink-850 p-4">
                      <div className="text-xs text-slate-500">GPU под · vLLM</div>
                      <div className="mt-1 text-sm font-semibold text-white">2× H100 80GB</div>
                      <div className="mt-3 h-1.5 rounded-full bg-white/5"><div className="h-full w-3/4 rounded-full bg-emerald-400" /></div>
                      <div className="mt-1 text-[10px] text-slate-500">утилизация 74%</div>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-ink-850 p-4">
                      <div className="text-xs text-slate-500">Wildmetrics · сегодня</div>
                      <div className="mt-1 text-2xl font-semibold text-white">48 213</div>
                      <div className="text-xs text-emerald-400">+12.4% визитов</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* stats */}
      <section className="border-y border-white/[0.05] bg-ink-900/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {stats.map(([v, l]) => (
            <div key={l}>
              <div className="text-xl font-semibold text-white sm:text-2xl">{v}</div>
              <div className="mt-1 text-sm text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* products */}
      <section id="products" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="mb-14 max-w-2xl">
          <div className="mb-3 text-sm font-medium text-violet-400">Продукты</div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Семь платформ, которые работают вместе</h2>
          <p className="mt-4 text-slate-400">Данные из аналитики попадают в BI и платформу данных, модели обучаются на ML-платформе и разворачиваются на GPU, а AI-агенты используют всё это как инструменты.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.filter((s) => !s.soon).map((s, idx) => (
            <Link
              to="/login"
              key={s.id}
              className={`group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-ink-900 p-6 transition hover:border-white/15 hover:bg-ink-850 ${idx === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}`}
            >
              <div className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${s.gradient} opacity-10 blur-3xl transition group-hover:opacity-25`} />
              <div className={`mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${s.gradient} shadow-lg`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{s.tagline}</p>
              <ul className={`mt-5 grid gap-2 ${idx === 0 ? 'sm:grid-cols-2' : ''}`}>
                {s.items.map((i) => (
                  <li key={i.path} className="flex items-start gap-2.5 text-sm">
                    <i.icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: s.accent }} />
                    <span>
                      <span className="text-slate-200">{i.title}</span>
                      {idx === 0 && <span className="block text-xs text-slate-500">{i.desc}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center gap-1 text-sm font-medium text-slate-300 group-hover:text-white">
                Попробовать <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-white/10 p-6">
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-white/5">
              <Layers className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">И это только начало</h3>
            <p className="mt-1.5 text-sm text-slate-400">В разработке: Security Center, CI/CD, маркетплейс решений и AI-поддержка для сайтов.</p>
          </div>
        </div>
      </section>

      {/* how */}
      <section id="how" className="relative border-y border-white/[0.05] bg-ink-900/40 py-24">
        <div className="dot-bg pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">Запуск за три шага</h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { icon: User, t: 'Создайте кабинет', d: 'Личный — для себя, или кабинет компании с реквизитами, договором и командой.' },
              { icon: Zap, t: 'Подключите сервисы', d: 'Включайте нужные продукты: от чата с LLM до кластера Kubernetes. Без отдельных договоров.' },
              { icon: Terminal, t: 'Платите за использование', d: 'Единый баланс и детализация по каждому сервису. Поминутная тарификация GPU.' },
            ].map((s, i) => (
              <div key={s.t} className="card relative p-6">
                <div className="absolute right-6 top-6 font-mono text-5xl font-bold text-white/[0.04]">0{i + 1}</div>
                <s.icon className="h-6 w-6 text-violet-400" />
                <h3 className="mt-4 text-lg font-semibold text-white">{s.t}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* business */}
      <section id="business" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-sm font-medium text-violet-400">Физлица и компании</div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Кабинеты для любой формы работы</h2>
            <p className="mt-4 text-slate-400">Переключайтесь между личным кабинетом и кабинетами компаний в один клик. У каждого — свой баланс, ресурсы и доступы.</p>
            <ul className="mt-8 space-y-3">
              {['Оплата картой или по счёту', 'Договор-оферта и закрывающие документы через ЭДО', 'Роли и права для сотрудников', 'Отдельные лимиты и бюджеты по проектам'].map((f) => (
                <li key={f} className="flex items-center gap-3 text-slate-300">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/15"><Check className="h-3 w-3 text-emerald-400" /></span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-6">
              <User className="h-6 w-6 text-cyan-300" />
              <div className="mt-4 font-semibold text-white">Физическое лицо</div>
              <p className="mt-1 text-sm text-slate-400">Быстрый старт, оплата картой, персональные проекты.</p>
            </div>
            <div className="card p-6 sm:translate-y-8">
              <Building2 className="h-6 w-6 text-violet-300" />
              <div className="mt-4 font-semibold text-white">Юридическое лицо</div>
              <p className="mt-1 text-sm text-slate-400">ИНН/КПП, счета, ЭДО, команда и аудит действий.</p>
            </div>
            <div className="card p-6">
              <ShieldCheck className="h-6 w-6 text-emerald-300" />
              <div className="mt-4 font-semibold text-white">Безопасность</div>
              <p className="mt-1 text-sm text-slate-400">Шифрование, изоляция ресурсов, 2FA и SSO.</p>
            </div>
            <div className="card p-6 sm:translate-y-8">
              <Globe2 className="h-6 w-6 text-amber-300" />
              <div className="mt-4 font-semibold text-white">Данные в РФ</div>
              <p className="mt-1 text-sm text-slate-400">Дата-центры уровня Tier III, соответствие 152-ФЗ.</p>
            </div>
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="border-t border-white/[0.05] bg-ink-900/40 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">Прозрачные тарифы</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-slate-400">Инфраструктура (GPU, VM, базы данных) тарифицируется отдельно по факту использования.</p>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {pricing.map((p) => (
              <div key={p.name} className={`card relative p-7 ${p.hot ? 'border-violet-500/40 bg-gradient-to-b from-violet-500/10 to-ink-900' : ''}`}>
                {p.hot && <span className="absolute right-6 top-6 rounded-full bg-violet-500 px-2.5 py-0.5 text-xs font-medium text-white">Популярный</span>}
                <div className="text-sm font-medium text-slate-400">{p.name}</div>
                <div className="mt-3 text-3xl font-bold text-white">{p.price}</div>
                <div className="text-sm text-slate-500">{p.note}</div>
                <ul className="mt-6 space-y-3">
                  {p.feats.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className={`${p.hot ? 'btn-primary' : 'btn-ghost'} mt-8 w-full`}>Выбрать</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* cta */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-600/30 via-ink-900 to-cyan-500/20 p-10 text-center sm:p-16">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
          <h2 className="relative text-3xl font-bold text-white sm:text-4xl">Готовы попробовать?</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-slate-300">Откройте платформу и посмотрите все сервисы изнутри.</p>
          <Link to="/login" className="btn-primary relative mt-8 px-6 py-3 text-base">
            Войти на платформу <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.05]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
          <Logo />
          <span>© {new Date().getFullYear()} AI Studio. Хаб IT-сервисов.</span>
        </div>
      </footer>
    </div>
  )
}
