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
        sans: ['"Host Grotesk"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
