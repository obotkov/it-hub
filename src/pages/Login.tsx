import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Github, KeyRound } from 'lucide-react'
import Logo from '../components/Logo'
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
          <Link to="/" className="flex items-center gap-1 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> На главную
          </Link>
        </div>
        <form onSubmit={submit} className="mx-auto w-full max-w-sm animate-fadeup py-12">
          <h1 className="text-3xl font-bold tracking-tight text-white">Вход на платформу</h1>
          <p className="mt-2 text-sm text-slate-400">Регистрация скоро откроется. Сейчас доступен демо-вход.</p>
          <div className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Пароль</label>
              <input className="input" type="password" placeholder="любой для демо" value={pass} onChange={(e) => setPass(e.target.value)} />
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
        <div className="text-xs text-slate-600">© AI Studio</div>
      </div>
      <div className="relative hidden overflow-hidden border-l border-white/5 bg-ink-900 lg:block">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="absolute left-1/3 top-1/4 h-96 w-96 rounded-full bg-violet-600/25 blur-[100px]" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-cyan-500/15 blur-[90px]" />
        <div className="relative flex h-full flex-col justify-center p-16">
          <h2 className="max-w-md text-3xl font-semibold leading-tight text-white">Один вход — все платформы</h2>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            {sections.filter((s) => !s.soon).map((s, i) => (
              <div key={s.id} className="card flex animate-float items-center gap-3 p-3" style={{ animationDelay: `${i * 0.4}s` }}>
                <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${s.gradient}`}>
                  <s.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-slate-200">{s.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
