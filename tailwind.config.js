/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro Text"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#0A84FF',
          hover: '#409CFF',
          dark: '#0066CC',
          subtle: 'rgba(10, 132, 255, 0.12)',
          glow: 'rgba(10, 132, 255, 0.25)',
        },
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          hover: 'rgba(255, 255, 255, 0.10)',
          elevated: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.12)',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.5)',
        'accent-glow': '0 0 20px rgba(10, 132, 255, 0.3)',
      },
    },
  },
  plugins: [],
}
