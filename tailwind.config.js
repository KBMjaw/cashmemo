/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef1f8',
          100: '#d6ddef',
          200: '#aebbdf',
          300: '#8598ca',
          400: '#5c73ae',
          500: '#3d5290',
          600: '#293c74',
          700: '#1c2b5a',
          800: '#121d42',
          900: '#0a1230',
          950: '#050a1c',
        },
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bcdcff',
          300: '#8ec5ff',
          400: '#59a5ff',
          500: '#3182f6',
          600: '#1c63e0',
          700: '#184fb5',
          800: '#194392',
          900: '#1a3a75',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(10, 18, 48, 0.06), 0 2px 8px rgba(10, 18, 48, 0.06)',
        cardHover: '0 4px 10px rgba(10, 18, 48, 0.08), 0 8px 24px rgba(10, 18, 48, 0.1)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
