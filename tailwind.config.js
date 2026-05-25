/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'Playfair Display'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      fontSize: {
        'h1-mobile': '36px',
        'h1-desktop': '72px',
        'h2-mobile': '28px',
        'h2-desktop': '48px',
        'h3-mobile': '22px',
        'h3-desktop': '32px',
        'base': '16px',
      },
      colors: {
        primary: "#1e406f",
        luxury: "#c5a059",
      }
    },
  },
  plugins: [],
}

