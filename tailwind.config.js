/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#030307',
        cardDark: 'rgba(10, 10, 18, 0.85)',
        panelDark: '#07070d',
        cyanGlow: '#06B6D4',
        violetApex: '#8B5CF6',
        emeraldGlow: '#22C55E',
        roseAlert: '#F43F5E',
        amberWarn: '#F59E0B'
      },
      fontFamily: {
        ar: ['Tajawal', 'sans-serif'],
        en: ['Plus Jakarta Sans', 'sans-serif']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.25)',
        'glow-violet': '0 0 25px rgba(139, 92, 246, 0.3)',
        'glow-emerald': '0 0 20px rgba(34, 197, 94, 0.25)',
      }
    },
  },
  plugins: [],
}
