/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'earth': {
          'blue': '#4A90E2',      // Light blue
          'dark': '#2D4B35',      // Dark green
          'olive': '#8B9B6B',     // Olive green
          'white': '#FFFFFF',     // White
          'peach': '#F5A26C',     // Peach/Orange
          'blue-light': '#6BA4E8', // Lighter blue for hover
          'dark-light': '#3D5B45', // Lighter dark green for hover
          'olive-light': '#9BAB7B', // Lighter olive for hover
          'peach-light': '#F7B588' // Lighter peach for hover
        }
      },
      backgroundColor: {
        'primary': '#FFF8E7',
        'secondary': '#6B7B3C',
        'accent': '#B8693B'
      },
      textColor: {
        'primary': '#2C3A1B',
        'secondary': '#FFF8E7',
        'accent': '#B8693B'
      },
      
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
