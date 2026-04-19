export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      /* 🎨 COLORES OFICIALES */
      colors: {
        primary: "#1d294a",
        "primary-600": "#2d3f6e",

        accent: "#ffdd1a",
        "accent-600": "#ffc400",

        white: "#ffffff",
      },

      /* 🔤 TIPOGRAFÍAS */
      fontFamily: {
        heading: ["Nunito", "sans-serif"],
        body: ['"Proxima Nova"', "Nunito", "sans-serif"],
      },

      /* 🔠 TAMAÑOS */
      fontSize: {
        h1: ["2rem", { lineHeight: "2.5rem", fontWeight: "700" }],
        h2: ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }],
        h3: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
      },

      /* 🌑 SOMBRAS */
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.08)",
        "card-hover": "0 10px 30px rgba(0,0,0,0.12)",
        accent: "0 4px 14px rgba(255, 221, 26, 0.4)",
      },

      /* 🔘 BORDES */
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },

  plugins: [],
};