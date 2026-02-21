/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#8e0505",
        "accent-gold": "#f3c623",
        "background-dark": "#0a0202",
        "panel-dark": "#1d0808"
      },
    }
  },
  content: [
    "./App.tsx",
    "./index.tsx",
    "./screens/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [],
}
