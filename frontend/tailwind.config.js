/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c7d9fe',
          300: '#a3c0fd',
          400: '#759dfa',
          500: '#4a75f6',
          600: '#2b52ec',
          700: '#1e3ebc',
          800: '#1b3597',
          900: '#1e3a8a', // Core Academic Navy
          950: '#0f172a', // Deep Navy / Slate
        },
        present: {
          light: '#dcfce7',
          DEFAULT: '#16a34a',
          dark: '#15803d',
          text: '#14532d'
        },
        absent: {
          light: '#fee2e2',
          DEFAULT: '#dc2626',
          dark: '#b91c1c',
          text: '#7f1d1d'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
