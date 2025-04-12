/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0F3460", // Deep blue
        secondary: "#D1A080", // Tan
        accent: "#E6B89C", // Lighter tan
        background: "#F9F6F2", // Very light tan
        dark: "#081F3C", // Darker blue
        "blue-900": "#0F3460",
        "blue-800": "#1A4D8C",
        "blue-700": "#2463A6",
        "tan-100": "#F9F6F2",
        "tan-200": "#EFE6DB",
        "tan-300": "#E6B89C",
        "tan-400": "#D1A080",
        "tan-500": "#BE8A6A",
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'sans-serif'],
        heading: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        card: '0 10px 15px -3px rgba(15, 52, 96, 0.1), 0 4px 6px -2px rgba(15, 52, 96, 0.05)',
      },
    },
  },
  plugins: [],
}
