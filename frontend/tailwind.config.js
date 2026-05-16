/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas:  '#F0F2F5',
        surface: '#FFFFFF',
        line:    '#E2E6EB',
        ink: {
          DEFAULT: '#0E0E10',
          2:       '#4B5563',
          3:       '#9CA3AF',
        },
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          600: '#4F46E5',
          700: '#4338CA',
        },
      },
    },
  },
  plugins: [],
}
