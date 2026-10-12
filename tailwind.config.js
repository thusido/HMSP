/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#ffffff',
        paperDeep: '#f5f5f5',
        tint: '#f7f5ed',
        fog: '#ebebeb',
        ink: '#1a1712',
        graphite: '#707070',
        smoke: '#adadad',
        sunshine: '#ffda6e',
        mint: '#6ece9d',
        night: '#0a0a0a',
        nightCard: '#141414',
        nightHover: '#1f1f1f',
      },
    },
  },
  plugins: [],
};
