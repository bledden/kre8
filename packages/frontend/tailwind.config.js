/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        card: '#101010',
        'x-blue': '#1D9BF0',
        'x-blue-hover': '#1A8CD8',
        'text-primary': '#E7E9EA',
        'text-secondary': '#71767B',
        'border-primary': '#2F3336',
      },
    },
  },
  plugins: [],
}

