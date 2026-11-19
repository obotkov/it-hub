import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cx } from './ui'

type Theme = 'light' | 'dark'

const current = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current)

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
      className={cx('grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200', className)}
    >
      {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
    </button>
  )
}
