/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  important: true,
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          lighter: 'var(--color-primary-lighter)',
        },
        surface: 'var(--color-surface)',
      },
      fontFamily: {
        sans: ['Roboto', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
