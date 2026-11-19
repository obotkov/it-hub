import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Building2, ChevronDown, ChevronsUpDown, Home, LogOut, Menu, Plus, Search, Settings, User, Wallet, X, Bell, Check } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { sections, findItem } from '../nav'
import { useAccount } from '../account'
import { cx } from '../components/ui'
import CabinetModal from './CabinetModal'

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const loc = useLocation()
  const active = findItem(loc.pathname)?.section.id
  const [open, setOpen] = useState<Record<string, boolean>>(() => ({ [active ?? 'ai']: true }))
  useEffect(() => {
    if (active) setOpen((o) => ({ ...o, [active]: true }))
  }, [active])

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link to="/app" onClick={onNavigate}><Logo /></Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        <NavLink
          to="/app"
          end
          onClick={onNavigate}
          className={({ isActive }) => cx('menu-item mb-1 gap-3', isActive && 'menu-item-active')}
        >
          <Home className="h-4 w-4" /> Обзор
        </NavLink>
        <div className="px-3 pb-1 pt-2 text-xs text-slate-500">Платформы</div>
        {sections.map((s) => {
          const isOpen = open[s.id]
          const isActive = active === s.id
          return (
            <div key={s.id}>
              {s.soon && <div className="mx-3 my-2 h-px bg-white/[0.06]" />}
              <button
                onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}
                className={cx('menu-item w-full gap-3', isActive && '!text-violet-400')}
              >
                <s.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-left">{s.title}</span>
                <ChevronDown className={cx('h-3.5 w-3.5 opacity-60 transition', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="space-y-1 py-1">
                  {s.items.map((i) => (
                    <NavLink
                      key={i.path}
                      to={`/app/${i.path}`}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cx('menu-item pl-10', isActive && 'menu-item-active')
                      }
                    >
                      <i.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{i.title}</span>
                      {s.soon && <span className="ml-auto rounded border border-white/[0.12] bg-white/[0.04] px-1.5 text-[11px] leading-4 text-slate-500">скоро</span>}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <div className="border-t border-white/[0.06] p-3">
        <NavLink to="/app/cabinets" onClick={onNavigate} className={({ isActive }) => cx('menu-item gap-3', isActive && 'menu-item-active')}>
          <Settings className="h-4 w-4" /> Кабинеты и настройки
        </NavLink>
      </div>
    </div>
  )
}

function CabinetSwitcher() {
  const { cabinets, current, setCurrent } = useAccount()
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex h-10 items-center gap-2.5 rounded-lg border border-white/[0.12] bg-ink-850 pl-1.5 pr-3 text-sm transition-colors hover:border-violet-400">
        <span className={cx('grid h-7 w-7 place-items-center rounded-md', current.type === 'legal' ? 'bg-violet-500/10 text-violet-400' : 'bg-teal-500/10 text-teal-400')}>
          {current.type === 'legal' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[160px] truncate font-medium leading-tight text-white">{current.name}</span>
          <span className="block text-[11px] leading-tight text-slate-500">{current.type === 'legal' ? 'Юридическое лицо' : 'Физическое лицо'}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 text-slate-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-40 mt-1 w-72 animate-fadeup rounded-lg bg-ink-850 p-1 shadow-2xl">
            <div className="px-3 py-1.5 text-xs text-slate-500">Кабинеты</div>
            {cabinets.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCurrent(c.id)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded px-2 py-1.5 text-left hover:bg-white/[0.04]"
              >
                <span className={cx('grid h-8 w-8 place-items-center rounded-md', c.type === 'legal' ? 'bg-violet-500/10 text-violet-400' : 'bg-teal-500/10 text-teal-400')}>
                  {c.type === 'legal' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </span>
                <span className="flex-1 truncate">
                  <span className="block truncate text-sm text-white">{c.name}</span>
                  <span className="block text-[11px] text-slate-500">{c.type === 'legal' ? `ИНН ${c.inn ?? '—'}` : 'Физлицо'}</span>
                </span>
                {c.id === current.id && <Check className="h-4 w-4 text-violet-400" />}
              </button>
            ))}
            <div className="my-1 h-px bg-white/[0.06]" />
            <button
              onClick={() => {
                setOpen(false)
                setModal(true)
              }}
              className="flex w-full items-center gap-3 rounded px-2 py-1.5 text-sm text-slate-200 hover:bg-white/[0.04]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-dashed border-white/15"><Plus className="h-4 w-4" /></span>
              Создать кабинет
            </button>
          </div>
        </>
      )}
      <CabinetModal open={modal} onClose={() => setModal(false)} />
    </div>
  )
}

export default function Layout() {
  const [mobile, setMobile] = useState(false)
  const { user, logout, current } = useAccount()
  const nav = useNavigate()
  const loc = useLocation()
  const found = findItem(loc.pathname)

  useEffect(() => {
    document.querySelector('main')?.scrollTo(0, 0)
  }, [loc.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] bg-ink-900 lg:block">
        <Sidebar />
      </aside>
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/45" onClick={() => setMobile(false)} />
          <aside className="relative h-full w-64 animate-fadeup bg-ink-900 shadow-2xl">
            <button onClick={() => setMobile(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10"><X className="h-5 w-5" /></button>
            <Sidebar onNavigate={() => setMobile(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-ink-900 px-4 sm:px-6">
          <button onClick={() => setMobile(true)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"><Menu className="h-5 w-5" /></button>
          <CabinetSwitcher />
          {found && (
            <div className="hidden items-center gap-2 text-sm text-slate-500 xl:flex">
              <span>/</span>
              <span>{found.section.title}</span>
              <span>/</span>
              <span className="text-slate-200">{found.item.title}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input className="input w-64 pl-9" placeholder="Поиск по сервисам…" />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-white/[0.12] bg-white/[0.04] px-1.5 font-sans text-[11px] text-slate-500">⌘K</kbd>
            </div>
            <Link to="/app/billing" className="btn-ghost hidden sm:inline-flex">
              <Wallet className="h-4 w-4 text-emerald-400" />
              <span className="tabular-nums">{current.balance.toLocaleString('ru-RU')} ₽</span>
            </Link>
            <ThemeToggle />
            <button className="relative grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-1 ring-ink-900" />
            </button>
            <div className="group relative">
              <button className="on-accent grid h-8 w-8 place-items-center rounded-full bg-violet-500 text-sm uppercase text-white">
                {user?.name[0]}
              </button>
              <div className="invisible absolute right-0 top-full z-40 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
                <div className="w-56 rounded-lg bg-ink-850 p-1 shadow-2xl">
                  <div className="px-3 py-2">
                    <div className="text-sm text-white">{user?.name}</div>
                    <div className="truncate text-xs text-slate-500">{user?.email}</div>
                  </div>
                  <div className="my-1 h-px bg-white/[0.06]" />
                  <Link to="/app/cabinets" className="flex items-center gap-2 rounded px-3 py-1.5 text-sm text-slate-200 hover:bg-white/[0.04]"><Settings className="h-4 w-4" /> Настройки</Link>
                  <button
                    onClick={() => {
                      logout()
                      nav('/')
                    }}
                    className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm text-rose-400 hover:bg-white/[0.04]"
                  >
                    <LogOut className="h-4 w-4" /> Выйти
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div key={loc.pathname} className="mx-auto max-w-[1400px] animate-fadeup p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
