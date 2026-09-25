/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Paleta extraída de code.html (tema BarberSync PRO)
      colors: {
        brand: {
          gold: '#F59E0B',
          goldLight: '#FDE68A',
          goldHover: '#D97706',
          dark: '#0A0C10',
          card: '#131720',
          cardHover: '#1B212E',
          border: '#1E2638',
          muted: '#8491A5',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-up': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-up': 'scale-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
