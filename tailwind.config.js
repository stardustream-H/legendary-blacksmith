/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#0d0b08',
          card: '#1a1510',
          border: '#3d2e1a',
          gold: '#c9a227',
          'gold-light': '#e8c84a',
          text: '#e8dcc8',
          'text-dim': '#a89880',
          success: '#4a7c59',
          failure: '#7c1a1a',
          divine: '#5a3a8c',
        },
      },
      fontFamily: {
        game: ['"Noto Serif KR"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
