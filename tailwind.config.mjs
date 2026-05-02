/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0D0D0D",
          gold: "#C9A227",
          light: "#F8F8F8"
        },
        jacuzzi: {
          gold: "#e6c16a",
          "gold-deep": "#d4af37",
          cream: "#f8f2d9",
          nav: "#f9e7a3",
          mist: "#dbe8f5"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0, 0, 0, 0.08)"
      }
    }
  },
  plugins: []
};
