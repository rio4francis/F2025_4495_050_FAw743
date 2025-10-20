/** @type {import('tailwindcss').Config} */
export default {
  important: true, // <— force utilities to win
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        gp: {
          DEFAULT: "#0e5f3a",
          green: "#0e5f3a",
          green2: "#14935a",
          text: "#223c2f",
          heading: "#0e5f3a",
          border: "#e4efe8",
          panel: "#ffffff",
          panelSoft: "#f6fbf8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Avenir", "Helvetica", "Arial", "ui-sans-serif", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 26px rgba(0,0,0,.06)",
        cardLg: "0 16px 36px rgba(0,0,0,.10)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
