/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        bg2: 'var(--bg2)',
        bg3: 'var(--bg3)',
        border: 'var(--border)',
        border2: 'var(--border2)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        text2: 'var(--text2)',
        text3: 'var(--text3)',
        red: 'var(--red)',
        'red-dim': 'var(--red-dim)',
        amber: 'var(--amber)',
        'amber-dim': 'var(--amber-dim)',
        green: 'var(--green)',
        'green-dim': 'var(--green-dim)',
        accent: 'var(--accent)',
        'on-red': 'var(--on-red)',
      },
      fontFamily: {
        mono: 'var(--font-mono)',
        body: 'var(--font-body)',
        display: 'var(--font-display)',
      },
    },
  },
  plugins: [],
};
