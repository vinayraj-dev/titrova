/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: v('paper'),
        surface: v('surface'),
        sunken: v('sunken'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        iodine: { DEFAULT: v('iodine'), ink: v('iodine-ink') },
        copper: { DEFAULT: v('copper'), ink: v('copper-ink') },
        violet: v('violet'),
        onink: v('onink'),
        danger: v('danger'),
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: { page: '76rem' },
      boxShadow: {
        lift: '0 1px 0 rgb(var(--ink) / 0.04), 0 18px 40px -22px rgb(var(--ink) / 0.35)',
        panel: '0 1px 0 rgb(var(--ink) / 0.05), 0 40px 80px -40px rgb(var(--ink) / 0.45)',
      },
    },
  },
  plugins: [],
};
