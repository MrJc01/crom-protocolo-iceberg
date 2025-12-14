/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores por nível do Iceberg
        "level-0": "#9ca3af", // Cinza
        "level-1": "#3b82f6", // Azul
        "level-2": "#22c55e", // Verde
        "level-3": "#eab308", // Dourado
        // Cores do tema
        primary: "#0ea5e9",
        secondary: "#64748b",
        background: "#0f172a",
        surface: "#1e293b",
        "on-surface": "#f1f5f9",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
