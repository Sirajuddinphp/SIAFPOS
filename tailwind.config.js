/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#F5F7FA",
          surface: "#FFFFFF",
          muted: "#EEF2F6",
          border: "#DDE4EC",
          text: "#17202A",
          subtle: "#5D6D7E",
          primary: "#0E7C66",
          danger: "#C0392B",
          warning: "#B7791F",
          info: "#2563A8"
        }
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};
