import plugin from 'tailwindcss/plugin'

/**
 * Theming: every palette colour is a CSS variable (`--c-<name>-<shade>`, "r g b"), filled from
 * Ant Design v5 tokens. `:root` holds the dark values; `html[data-theme=light]` (the default)
 * remaps the neutrals (ink, slate, white) and the accent shades used for text.
 * `.on-accent` pins `white` back to real white (text on gradient/colored surfaces).
 * `.theme-fixed` restores the dark defaults for a subtree.
 */

const rgb = (hex) => {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/* Ant Design v5 tokens (design/Ant Design System for Figma). */
const ink = { 950: '#000000', 900: '#141414', 850: '#1f1f1f', 800: '#262626', 700: '#303030', 600: '#424242', 500: '#595959' }
const inkLight = { 950: '#f5f5f5', 900: '#ffffff', 850: '#ffffff', 800: '#fafafa', 700: '#f0f0f0', 600: '#d9d9d9', 500: '#bfbfbf' }

// Ant neutral text scale: slate-200 ≈ colorText, 400 ≈ colorTextSecondary, 500 ≈ colorTextTertiary.
const slateDark = { 50: '#ffffff', 100: '#f0f0f0', 200: '#d9d9d9', 300: '#bfbfbf', 400: '#a6a6a6', 500: '#737373', 600: '#595959', 700: '#434343', 800: '#303030', 900: '#1f1f1f', 950: '#141414' }
const slateLight = { 50: '#000000', 100: '#141414', 200: '#1f1f1f', 300: '#434343', 400: '#595959', 500: '#8c8c8c', 600: '#bfbfbf', 700: '#d9d9d9', 800: '#f0f0f0', 900: '#f5f5f5', 950: '#fafafa' }

// Ant colour palettes, shades 1–10.
const ant = {
  blue: ['e6f4ff', 'bae0ff', '91caff', '69b1ff', '4096ff', '1677ff', '0958d9', '003eb3', '002c8c', '001d66'],
  geekblue: ['f0f5ff', 'd6e4ff', 'adc6ff', '85a5ff', '597ef7', '2f54eb', '1d39c4', '10239e', '061178', '030852'],
  purple: ['f9f0ff', 'efdbff', 'd3adf7', 'b37feb', '9254de', '722ed1', '531dab', '391085', '22075e', '120338'],
  magenta: ['fff0f6', 'ffd6e7', 'ffadd2', 'ff85c0', 'f759ab', 'eb2f96', 'c41d7f', '9e1068', '780650', '520339'],
  red: ['fff1f0', 'ffccc7', 'ffa39e', 'ff7875', 'ff4d4f', 'f5222d', 'cf1322', 'a8071a', '820014', '5c0011'],
  orange: ['fff7e6', 'ffe7ba', 'ffd591', 'ffc069', 'ffa940', 'fa8c16', 'd46b08', 'ad4e00', '873800', '612500'],
  gold: ['fffbe6', 'fff1b8', 'ffe58f', 'ffd666', 'ffc53d', 'faad14', 'd48806', 'ad6800', '874d00', '613400'],
  yellow: ['feffe6', 'ffffb8', 'fffb8f', 'fff566', 'ffec3d', 'fadb14', 'd4b106', 'ad8b00', '876800', '614700'],
  green: ['f6ffed', 'd9f7be', 'b7eb8f', '95de64', '73d13d', '52c41a', '389e0d', '237804', '135200', '092b00'],
  cyan: ['e6fffb', 'b5f5ec', '87e8de', '5cdbd3', '36cfc9', '13c2c2', '08979c', '006d75', '00474f', '002329'],
}
// Tailwind palette name -> Ant palette. violet/cyan were the brand accents; both become Ant primary blue.
const alias = {
  violet: 'blue', indigo: 'geekblue', purple: 'purple', fuchsia: 'magenta', pink: 'magenta', blue: 'blue', sky: 'blue', cyan: 'blue',
  teal: 'cyan', emerald: 'green', green: 'green', yellow: 'yellow', amber: 'gold', orange: 'orange', red: 'red', rose: 'red',
}
const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const shade = (p, s) => '#' + ant[alias[p]][Math.min(steps.indexOf(Number(s)), 9)]

const accents = Object.keys(alias)
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
for (const p of palettes) themeColors[p] = Object.fromEntries(steps.map((s) => [s, v(`${p}-${s}`)]))

const darkVars = { '--c-white': '255 255 255' }
for (const [k, c] of Object.entries(ink)) darkVars[`--c-ink-${k}`] = rgb(c)
for (const [s, c] of Object.entries(slateDark)) darkVars[`--c-slate-${s}`] = rgb(c)
for (const p of accents) for (const s of steps) darkVars[`--c-${p}-${s}`] = rgb(shade(p, s))

// Light: headings = colorTextHeading (≈ #1f1f1f); the light accent shades used for text move to
// Ant's *Text colours (shade 6, or 7 for the pale warm palettes) so they stay readable on white.
const warm = new Set(['gold', 'yellow', 'green', 'orange', 'cyan'])
const lightVars = { '--c-white': '31 31 31' }
for (const [k, c] of Object.entries(inkLight)) lightVars[`--c-ink-${k}`] = rgb(c)
for (const [s, c] of Object.entries(slateLight)) lightVars[`--c-slate-${s}`] = rgb(c)
for (const p of accents) {
  const shift = warm.has(alias[p]) ? { 200: 800, 300: 700, 400: 600 } : { 200: 700, 300: 600, 400: 500 }
  for (const [s, t] of Object.entries(shift)) lightVars[`--c-${p}-${s}`] = rgb(shade(p, t))
}

const shadowSecondary = '0 6px 16px 0 rgb(0 0 0 / 0.08), 0 3px 6px -4px rgb(0 0 0 / 0.12), 0 9px 28px 8px rgb(0 0 0 / 0.05)'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: themeColors,
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"'],
        mono: ['SFMono-Regular', 'Consolas', '"Liberation Mono"', 'Menlo', 'Courier', 'monospace'],
      },
      borderRadius: { sm: '2px', DEFAULT: '4px', md: '4px', lg: '6px', xl: '8px', '2xl': '8px', '3xl': '12px' },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 6px -1px rgb(0 0 0 / 0.02), 0 2px 4px 0 rgb(0 0 0 / 0.02)',
        DEFAULT: '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 6px -1px rgb(0 0 0 / 0.02), 0 2px 4px 0 rgb(0 0 0 / 0.02)',
        md: shadowSecondary,
        lg: shadowSecondary,
        xl: shadowSecondary,
        '2xl': shadowSecondary,
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
