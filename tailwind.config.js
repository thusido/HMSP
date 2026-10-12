/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#f8f5ed',
        paperDeep: '#ece4d0',
        ink: '#1a1712',
        graphite: '#707070',
        sunshine: '#ffda6e',
        mint: '#6ece9d',
        night: '#14120e',
        nightCard: '#1e1a14',
        nightHover: '#2a241b',
        chrome: {
          light: '#F3F4F6',
          hover: '#E5E7EB',
          active: '#D1D5DB',
          dark: '#1F2937',
        },
        drawer: {
          light: '#F9FAFB',
          folder: '#EAECEF',
          dark: '#1A202C',
        },
        accent: {
          highlight: 'rgba(254, 240, 138, 0.65)',
          blue: '#2563EB',
        },
      },
    },
  },
  plugins: [],
};
