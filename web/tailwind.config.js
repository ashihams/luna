/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lunar: {
          950: '#07090e',
          900: '#0d111a',
          800: '#171e2e',
          700: '#232d42',
          600: '#32405d',
          500: '#485a80',
          400: '#6f83ab',
          300: '#9cb0d4',
          200: '#cdd7eb',
          100: '#eef2f9',
        },
        sun: {
          glow: '#ffb703',
          beam: '#fb8500',
        },
        earth: {
          blue: '#219ebc',
          cyan: '#8ecae6',
        },
        brand: {
          DEFAULT: '#2e5bff',
          hover: '#1e48e0',
          light: '#eef2ff',
        },
        surface: {
          DEFAULT: '#ffffff',
          alt: '#f7f6f6',
          dark: '#141314',
          border: '#e0e0df',
        },
        content: {
          primary: '#201f20',
          secondary: '#494949',
          muted: '#606060',
          inverse: '#fcfcfd',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      colors: {
        cream: {
          DEFAULT: '#fcfbf9',
          50: '#ffffff',
          100: '#fcfbf9',
          200: '#f5f3ef',
          300: '#ece8e1',
        },
        charcoal: {
          DEFAULT: '#171717',
          900: '#171717',
          800: '#222222',
          700: '#2e2e2e',
        },
        borderLight: '#e5e5e5',
        indigo: {
          DEFAULT: '#4338ca',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      keyframes: {
        mesh: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.15)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        pulseGentle: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(67, 56, 202, 0)' },
          '50%': { transform: 'scale(1.02)', boxShadow: '0 10px 25px -5px rgba(67, 56, 202, 0.35)' },
        },
      },
      animation: {
        'mesh-drift': 'mesh 30s linear infinite',
        'pulse-gentle': 'pulseGentle 3s cubic-bezier(0.22, 1, 0.36, 1) infinite',
      },
    },
  },
  plugins: [],
};
