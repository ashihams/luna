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
        synapse: {
          bg: '#030303',
          card: 'rgba(255, 255, 255, 0.02)',
          glass: 'rgba(10, 10, 10, 0.7)',
          violet: '#8B5CF6',
          cyan: '#06B6D4',
          emerald: '#10B981',
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      transitionTimingFunction: {
        snappy: 'cubic-bezier(0.23, 1, 0.32, 1)',
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        spinConic: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        floatOrb1: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.05)' },
        },
        floatOrb2: {
          '0%, 100%': { transform: 'translateY(0px) scale(1.05)' },
          '50%': { transform: 'translateY(-25px) scale(0.98)' },
        },
      },
      animation: {
        shimmer: 'shimmer 4s ease-in-out infinite',
        'spin-conic': 'spinConic 4s linear infinite',
        ticker: 'ticker 40s linear infinite',
        'float-orb-1': 'floatOrb1 10s ease-in-out infinite',
        'float-orb-2': 'floatOrb2 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
