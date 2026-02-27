/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ① Design System - Primary
        primary: {
          DEFAULT: '#0F766E',
          light:   '#0D9488',
          dark:    '#0C5F58',
          50:      '#f0fdfa',
          100:     '#ccfbf1',
        },
        // ① Design System - Secondary (hover/highlight/progress)
        secondary: {
          DEFAULT: '#10B981',
          light:   '#34D399',
        },
        // ① Design System - Donate Accent (ONLY donate button!)
        donate: {
          DEFAULT: '#F59E0B',
          dark:    '#D97706',
        },
        // ① Design System - Backgrounds
        bg:   '#F8FAFC',
        card: '#FFFFFF',
        // ① Design System - Text
        text: {
          main:      '#0F172A',
          secondary: '#475569',
          light:     '#94A3B8',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      fontSize: {
        // ② Font System
        'h1':    ['28px', { lineHeight: '1.3', fontWeight: '700' }],
        'h2':    ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3':    ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body':  ['16px', { lineHeight: '1.6' }],
        'small': ['14px', { lineHeight: '1.5' }],
      },
      spacing: {
        // ③ Spacing System
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      borderRadius: {
        // ④ Button & Card radius
        'btn':       '10px',
        'donate-btn':'12px',
        'card':      '14px',
      },
      boxShadow: {
        'card':        '0 1px 8px rgba(0,0,0,0.07)',
        'card-hover':  '0 4px 20px rgba(0,0,0,0.12)',
        'donate':      '0 4px 12px rgba(245,158,11,0.3)',
        'donate-hover':'0 6px 16px rgba(245,158,11,0.4)',
      },
      height: {
        'navbar':     '72px',  // ⑦ Navbar
        'bottom-nav': '64px',  // ⑥ Bottom Nav
      },
    },
  },
  plugins: [],
}
