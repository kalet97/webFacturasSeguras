/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        success: {
          DEFAULT: '#22C55E',
          50: '#F0FDF4',
          100: '#DCFCE7',
          600: '#16A34A',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          600: '#D97706',
        },
        danger: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          100: '#FEE2E2',
          600: '#DC2626',
        },
      },
      borderRadius: {
        'card': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'card': '0 2px 16px rgba(37, 99, 235, 0.08)',
        'card-hover': '0 4px 24px rgba(37, 99, 235, 0.15)',
        'bottom-bar': '0 -4px 20px rgba(0, 0, 0, 0.08)',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
