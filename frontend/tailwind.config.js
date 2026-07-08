/** @type {import('tailwindcss').Config} */

export default {
  content: ['./src/**/*.{mjs,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dominant: '#1a1e24',
        secondary: '#353e4a',
        accent: '#94a3b7',
        'on-dominant': '#ffffff',
        'on-secondary': '#ffffff',
        'on-accent': '#000000'
      }
    }
  },
  plugins: []
}
