import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cx } from './ui'

type Theme = 'light' | 'dark'

const current = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current)

  useEffect(() => {
    // Follow the OS setting until the user picks a theme explicitly.
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      let saved: string | null = null
      try {
        saved = localStorage.getItem('hub.theme')
      } catch {
        /* ignore */
      }
      if (saved) return
      const t: Theme = mq.matches ? 'light' : 'dark'
      document.documentElement.dataset.theme = t
      setTheme(t)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const set = (t: Theme) => {
    document.documentElement.dataset.theme = t
    try {
      localStorage.setItem('hub.theme', t)
    } catch {
      /* ignore */
    }
    setTheme(t)
  }

  return { theme, set, toggle: () => set(theme === 'light' ? 'dark' : 'light') }
}

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
      aria-label="Переключить тему"
      className={cx('grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white', className)}
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  )
}
