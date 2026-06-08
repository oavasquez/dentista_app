/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      backgroundImage : {
        'login-background': "url('/assets/images/istamabackground.jpg')",
      }
    },
  },
  plugins: [],
};
