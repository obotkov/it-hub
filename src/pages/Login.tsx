import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Github, KeyRound } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { useAccount } from '../account'
import { sections } from '../nav'

export default function Login() {
  const { login } = useAccount()
  const nav = useNavigate()
  const [email, setEmail] = useState('demo@ai-studio.space')
  const [pass, setPass] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    login(email)
    nav('/app')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex flex-col justify-between p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/" className="flex items-center gap-1 text-sm text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> На главную
            </Link>
          </div>
        </div>
        <form onSubmit={submit} className="mx-auto w-full max-w-sm animate-fadeup py-12">
          <h1 className="text-[28px] font-medium leading-tight text-white">Вход на платформу</h1>
          <p className="mt-2 text-sm text-slate-400">Регистрация скоро откроется. Сейчас доступен демо-вход</p>
          <div className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Пароль</label>
              <input className="input" type="password" placeholder="Любой для демо" value={pass} onChange={(e) => setPass(e.target.value)} />
            </div>
            <button className="btn-primary w-full py-2.5">
              Войти <ArrowRight className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 py-1 text-xs text-slate-500">
              <span className="h-px flex-1 bg-white/10" /> или <span className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={submit as never} className="btn-ghost"><Github className="h-4 w-4" /> GitHub</button>
              <button type="button" onClick={submit as never} className="btn-ghost"><KeyRound className="h-4 w-4" /> SSO</button>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">
            Нет аккаунта? <span className="text-slate-400">Регистрация — скоро</span>
          </p>
        </form>
        <div className="text-xs text-slate-600">© IT Hub</div>
      </div>
      <div className="relative hidden overflow-hidden border-l border-white/5 bg-ink-900 lg:block">
        <div className="relative flex h-full flex-col justify-center p-16">
          <h2 className="max-w-md text-[28px] font-medium leading-tight text-white">Один вход — семь платформ и общий баланс</h2>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            {sections.filter((s) => !s.soon).map((s, i) => (
              <div key={s.id} className="flex h-12 items-center gap-3 rounded-xl border border-white/[0.07] bg-ink-850 px-4">
                <s.icon className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.5} />
                <span className="text-sm text-slate-200">{s.title}</span>
                <span className="meter ml-auto text-xs text-slate-500">{String(i + 1).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
