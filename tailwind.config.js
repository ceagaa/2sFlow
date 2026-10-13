/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Sequel Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
        },
        zinc: {
          100: 'var(--text-primary)',
          200: 'var(--text-secondary)',
          300: 'var(--text-secondary)',
          400: 'var(--text-tertiary)',
          500: 'var(--text-tertiary)',
          600: 'var(--text-muted)',
          700: 'var(--border)',
          800: 'var(--card)',
          900: 'var(--surface)',
          950: 'var(--app-background)',
        },
      },
      borderColor: {
        zinc: {
          700: 'var(--border)',
          800: 'var(--border)',
          900: 'var(--border)',
        },
      },
    },
  },
  plugins: [],
}
