/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        glass: {
          light: 'rgba(255,255,255,0.7)',
          medium: 'rgba(255,255,255,0.85)',
          border: 'rgba(255,255,255,0.3)',
        },
        primary: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
          800: '#3730a3', 900: '#312e81',
        },
        pharma: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
        },
        retail: { 50: '#fff7ed', 100: '#ffedd5', 500: '#f97316', 600: '#ea580c' },
        wholesale: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb' },
      },
      boxShadow: {
        morph: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6)',
        'morph-lg': '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
        'morph-xl': '0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
        glass: '0 8px 32px rgba(0,0,0,0.06)',
      },
      backdropBlur: { glass: '16px' },
      borderRadius: { morph: '1rem', 'morph-sm': '0.75rem', 'morph-xs': '0.5rem' },
    },
  },
  plugins: [],
};
