/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        softPink: 'rgba(247,214,226,1)',
        softBlue: '#cee8f7',
      },
      backgroundImage: {
        'login-gradient': 'linear-gradient(to bottom right, rgba(247,214,226,1), #cee8f7)',
      },
    },
  },
plugins: [
  require('@tailwindcss/forms'),
  require('@tailwindcss/typography'),
],

};