/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Primary accent · Clinical Teal ──
        primary: {
          50: '#eefbf7', 100: '#d3f6ed', 200: '#a6eee0', 300: '#6fdfd0',
          400: '#38cbb7', 500: '#14a394', 600: '#0ea296', 700: '#0d827a',
          800: '#11675f', 900: '#0f554e',
        },
        // ── Secondary accent · Mint ──
        mint: {
          50: '#effef7', 100: '#d3f9e8', 200: '#a8f1d2', 300: '#71e4ba',
          400: '#3dd0a2', 500: '#16b58a', 600: '#0d9a74', 700: '#0e7b60',
          800: '#10624e', 900: '#0f5041',
        },
        // ── Tertiary focal accent · Indigo/Violet (used sparingly) ──
        focus: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#5457e5', 700: '#4a47d4',
          800: '#3b3bb0', 900: '#2d2f87',
        },
        // ── pharma alias (backwards compatible) ──
        pharma: {
          50: '#eefbf7', 100: '#d3f6ed', 200: '#a6eee0', 300: '#6fdfd0',
          400: '#38cbb7', 500: '#14a394', 600: '#0ea296', 700: '#0d827a',
          800: '#11675f', 900: '#0f554e',
        },
        slate: {
          25: '#fcfcfd',
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
          400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
          800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
        retail: { 50: '#fff7ed', 100: '#ffedd5', 400: '#fb923c', 500: '#f97316', 600: '#ea580c' },
        wholesale: { 50: '#eff6ff', 100: '#dbeafe', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb' },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(16,99,80,0.06), 0 1px 2px -1px rgba(16,99,80,0.05)',
        'card-hover': '0 10px 30px -8px rgba(16,99,80,0.18), 0 6px 10px -6px rgba(16,99,80,0.12)',
        'sidebar': '6px 0 30px -10px rgba(2,44,56,0.28)',
        'modal': '0 24px 60px -12px rgba(9,62,58,0.35), 0 0 0 1px rgba(255,255,255,0.6)',
        'glow': '0 0 0 4px rgba(20,163,148,0.14), 0 8px 24px -6px rgba(20,163,148,0.45)',
        'glow-indigo': '0 0 0 4px rgba(99,102,241,0.14), 0 8px 24px -6px rgba(99,102,241,0.4)',
        'glow-sm': '0 4px 16px -4px rgba(20,163,148,0.4)',
        'soft': '0 1px 2px 0 rgba(15,85,82,0.05), 0 6px 20px -8px rgba(15,85,82,0.12)',
        'inner-glass': 'inset 0 1px 0 0 rgba(255,255,255,0.7)',
        'glow': '0 0 0 4px rgba(20,163,148,0.14), 0 8px 24px -6px rgba(20,163,148,0.45)',
      },
      borderRadius: {
        'xl': '0.875rem', '2xl': '1rem', '3xl': '1.25rem', '4xl': '1.75rem',
      },
      backgroundImage: {
        'grad-mesh': 'radial-gradient(1200px 700px at 8% -8%, rgba(20,163,148,0.16), transparent 55%), radial-gradient(1000px 620px at 105% 0%, rgba(99,102,241,0.14), transparent 50%), radial-gradient(900px 700px at 50% 118%, rgba(61,208,162,0.14), transparent 55%)',
        'grad-accent': 'linear-gradient(135deg, #14a394 0%, #0ea296 45%, #4a6ff0 100%)',
        'grad-accent-soft': 'linear-gradient(135deg, rgba(20,163,148,0.14), rgba(99,102,241,0.12))',
        'grad-brand': 'linear-gradient(135deg, #0d827a 0%, #0ea296 35%, #4a6ff0 100%)',
        'grad-brand-soft': 'linear-gradient(135deg, rgba(20,163,148,0.16), rgba(99,102,241,0.15))',
        'grad-hero': 'linear-gradient(135deg, #0f766e 0%, #14a394 28%, #6366f1 72%, #8b5cf6 100%)',
        'grad-cool': 'linear-gradient(135deg, #38bdf8 0%, #6366f1 60%, #8b5cf6 100%)',
        'grad-warm': 'linear-gradient(135deg, #f97316 0%, #f43f5e 100%)',
        'grad-gold': 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        'text-grad': 'linear-gradient(120deg, #0d827a 0%, #18b69b 45%, #6366f1 100%)',
        'text-grad-bright': 'linear-gradient(120deg, #38cbb7 0%, #7de8d6 40%, #a5b4fc 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'float-slow': 'float 14s ease-in-out infinite',
        'float-slower': 'float 22s ease-in-out infinite reverse',
        'drift': 'drift 26s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
        'gradient-x': 'gradientX 8s ease infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateY(-6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        float: { '0%,100%': { transform: 'translate(0, 0) scale(1)' }, '50%': { transform: 'translate(30px, -30px) scale(1.08)' } },
        drift: { '0%,100%': { transform: 'translate(0, 0)' }, '50%': { transform: 'translate(-40px, 30px)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        shimmer: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
        gradientX: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};