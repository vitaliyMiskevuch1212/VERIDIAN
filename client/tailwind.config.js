/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        veridian: {
          bg: '#0A0F1E',
          navy: '#0D1B2A',
          panel: '#111827',
          surface: '#1E293B',
          border: '#1E3A5F',
          cyan: '#00D4FF',
          green: '#00FF88',
          red: '#EF4444',
          orange: '#F97316',
          yellow: '#EAB308',
          gold: '#F59E0B',
          purple: '#7C3AED',
        }
      }
    },
  },
  plugins: [],
}
