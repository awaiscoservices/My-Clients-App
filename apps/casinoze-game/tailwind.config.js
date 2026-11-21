/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf4ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          900: '#3b0764',
        },
        gold: {
          400: '#ef4444',
          500: '#dc2626',
        }
      },
    },
  },
  plugins: [],
}
