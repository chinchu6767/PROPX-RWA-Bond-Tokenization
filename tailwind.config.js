/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        propx: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bbfc',
          400: '#8296f8',
          500: '#6471f1',
          600: '#4f52e6',
          700: '#3f3fcb',
          800: '#3535a4',
          900: '#2e3082',
          950: '#1c1d4b',
        },
        bond: {
          gold:   '#d4a017',
          green:  '#16a34a',
          red:    '#dc2626',
          blue:   '#1d4ed8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}

