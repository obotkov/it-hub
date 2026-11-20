import colors from 'tailwindcss/colors'
import plugin from 'tailwindcss/plugin'

/**
 * Theming: every palette colour is a CSS variable (`--c-<name>-<shade>`, "r g b").
 * Dark is the default; `html[data-theme=light]` remaps the neutrals (ink, slate, white)
 * and darkens the light accent shades (200–400) so accent text stays readable on white.
 * `.on-accent` pins `white` back to real white (text on the solid accent).
 * `.theme-fixed` restores the dark defaults for a subtree.
 */

const rgb = (hex) => {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

// Graphite surfaces (unslop direction: "control room" — neutral chrome, one violet accent).
// 950 page · 900 card · 850/800 raised · 700–500 strokes and fills
const ink = { 950: '#141415', 900: '#19191b', 850: '#1e1e20', 800: '#232325', 700: '#2b2b2e', 600: '#38383c', 500: '#4c4c51' }
const inkLight = { 950: '#fafafa', 900: '#ffffff', 850: '#f4f4f5', 800: '#ededee', 700: '#e4e4e7', 600: '#d4d4d8', 500: '#a1a1aa' }

// Text ramp: neutral grey, muted step lifted for contrast on graphite.
const grey = { ...colors.neutral, 500: '#86868b' }

// Real hues: the brand accent plus semantic colours. Decorative hues are folded into
// these below so stray `text-cyan-300` or `bg-fuchsia-500` cannot add a second accent.
const accents = ['violet', 'emerald', 'green', 'yellow', 'amber', 'red', 'rose']
const palettes = ['slate', ...accents]
const toViolet = ['fuchsia', 'purple', 'indigo', 'pink']
const toNeutral = ['blue', 'sky', 'cyan', 'teal', 'orange']

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
for (const p of toViolet) themeColors[p] = themeColors.violet
for (const p of toNeutral) themeColors[p] = themeColors.slate

const darkVars = { '--c-white': '237 237 237' }
for (const [k, c] of Object.entries(ink)) darkVars[`--c-ink-${k}`] = rgb(c)
for (const [s, c] of Object.entries(grey)) darkVars[`--c-slate-${s}`] = rgb(c)
for (const p of accents) for (const [s, c] of Object.entries(colors[p])) darkVars[`--c-${p}-${s}`] = rgb(c)

const slateFlip = { 50: 950, 100: 900, 200: 800, 300: 700, 400: 600, 500: 500, 600: 400, 700: 300, 800: 200, 900: 100, 950: 50 }
const accentShift = { 200: 800, 300: 700, 400: 600 }
const lightVars = { '--c-white': '23 23 23' }
for (const [k, c] of Object.entries(inkLight)) lightVars[`--c-ink-${k}`] = rgb(c)
for (const [s, t] of Object.entries(slateFlip)) lightVars[`--c-slate-${s}`] = rgb(colors.neutral[t])
for (const p of accents) for (const [s, t] of Object.entries(accentShift)) lightVars[`--c-${p}-${s}`] = rgb(colors[p][t])

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: themeColors,
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0.22, 1, 0.36, 1)', out: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      transitionDuration: { DEFAULT: '150ms' },
      keyframes: {
        fadeup: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: {
        fadeup: 'fadeup .36s cubic-bezier(0.22, 1, 0.36, 1) backwards',
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
