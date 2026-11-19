import colors from 'tailwindcss/colors'
import plugin from 'tailwindcss/plugin'

/**
 * Theming: every palette colour is a CSS variable (`--c-<name>-<shade>`, "r g b").
 * Dark is the default; `html[data-theme=light]` remaps the neutrals (ink, slate, white)
 * and darkens the light accent shades (200–400) so accent text stays readable on white.
 * `.on-accent` pins `white` back to real white (text on gradient/colored surfaces).
 * `.theme-fixed` restores the dark defaults for a subtree.
 */

const rgb = (hex) => {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

const ink = { 950: '#06070b', 900: '#0b0d14', 850: '#10131c', 800: '#151925', 700: '#1e2333', 600: '#2a3045', 500: '#3b4360' }
const inkLight = { 950: '#f5f6fa', 900: '#ffffff', 850: '#f1f3f8', 800: '#e8ebf2', 700: '#dde1ea', 600: '#c9d0dc', 500: '#94a3b8' }

const accents = ['violet', 'fuchsia', 'purple', 'indigo', 'blue', 'sky', 'cyan', 'teal', 'emerald', 'green', 'yellow', 'amber', 'orange', 'red', 'rose', 'pink']
const palettes = ['slate', ...accents]

const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

const themeColors = {
  transparent: 'transparent',
  current: 'currentColor',
  inherit: 'inherit',
  black: '#000',
  white: v('white'),
  ink: Object.fromEntries(Object.keys(ink).map((k) => [k, v(`ink-${k}`)])),
}
for (const p of palettes) themeColors[p] = Object.fromEntries(Object.keys(colors[p]).map((s) => [s, v(`${p}-${s}`)]))

const darkVars = { '--c-white': '255 255 255' }
for (const [k, c] of Object.entries(ink)) darkVars[`--c-ink-${k}`] = rgb(c)
for (const p of palettes) for (const [s, c] of Object.entries(colors[p])) darkVars[`--c-${p}-${s}`] = rgb(c)

const slateFlip = { 50: 950, 100: 900, 200: 800, 300: 700, 400: 600, 500: 500, 600: 400, 700: 300, 800: 200, 900: 100, 950: 50 }
const accentShift = { 200: 800, 300: 700, 400: 600 }
const lightVars = { '--c-white': '15 23 42' }
for (const [k, c] of Object.entries(inkLight)) lightVars[`--c-ink-${k}`] = rgb(c)
for (const [s, t] of Object.entries(slateFlip)) lightVars[`--c-slate-${s}`] = rgb(colors.slate[t])
for (const p of accents) for (const [s, t] of Object.entries(accentShift)) lightVars[`--c-${p}-${s}`] = rgb(colors[p][t])

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: themeColors,
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        shimmer: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
        fadeup: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
        fadeup: 'fadeup .35s ease-out both',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root, .theme-fixed': { ...darkVars, colorScheme: 'dark' },
        ':root[data-theme="light"]': { ...lightVars, colorScheme: 'light' },
        '.on-accent': { '--c-white': '255 255 255' },
      })
    }),
  ],
}
