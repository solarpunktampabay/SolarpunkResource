/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // Palette sampled from grist.org
      colors: {
        paper: '#F0F0F0', // page background
        ink: '#3C3830', // all text, borders, dark surfaces
        muted: '#6E6A60', // secondary text
        forest: '#005941', // header + footer + highlights (white text on top)
        'forest-deep': '#0B6E53', // forest hover / tiles
        sprout: '#8FC740', // primary action (dark text on top)
        'sprout-dark': '#7DB332',
      },
      fontFamily: {
        // Headlines: stand-in for Grist's "PolySans"
        display: [
          '"Bricolage Grotesque"',
          '"Schibsted Grotesk"',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        // Body copy + wordmark: stand-in for Grist's "GT Super"
        serif: ['Newsreader', 'Georgia', 'serif'],
        // UI, bylines, nav: stand-in for Grist's "Basis Grotesque"
        sans: [
          '"Schibsted Grotesk"',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      maxWidth: {
        page: '1440px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
