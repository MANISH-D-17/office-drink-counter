/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#003B73',
        'brand-amber': '#FBBF24',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        brand: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
