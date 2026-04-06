export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {

      /* 🎨 COLORES */
      colors: {
        primary: '#1d294a',
        'primary-600': '#16213a',
        accent: '#ffdd1a',
        'accent-600': '#e6c800',
      },

      /* 🔤 TIPOGRAFÍA */
      fontFamily: {
        heading: ['"Proxima Soft"', 'Nunito', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },

      /* 🔠 TAMAÑOS DE TEXTO */
      fontSize: {
        h2: ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
      },

      /* 🌑 SOMBRAS */
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.08)',
        'card-hover': '0 10px 30px rgba(0,0,0,0.12)',
        accent: '0 4px 14px rgba(255, 221, 26, 0.4)',
      },

    },
  },
  plugins: [],
}