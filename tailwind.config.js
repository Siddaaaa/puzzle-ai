/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          '"SF Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      colors: {
        // Semantic design tokens - Dark mode
        'surface': {
          primary: '#000000',
          secondary: '#1C1C1E',
          tertiary: '#2C2C2E',
          elevated: '#3A3A3C',
          glass: 'rgba(28,28,30,0.72)',
        },
        'fill': {
          primary: 'rgba(255,255,255,0.08)',
          secondary: 'rgba(255,255,255,0.05)',
          tertiary: 'rgba(255,255,255,0.03)',
        },
        'label': {
          primary: 'rgba(255,255,255,0.95)',
          secondary: 'rgba(255,255,255,0.60)',
          tertiary: 'rgba(255,255,255,0.35)',
          quaternary: 'rgba(255,255,255,0.18)',
        },
        'separator': {
          opaque: '#38383A',
          nonopaque: 'rgba(84,84,88,0.65)',
        },
        // Apple system blue
        'accent': {
          DEFAULT: '#0A84FF',
          light: '#007AFF',
          hover: '#0A84FF',
          muted: 'rgba(10,132,255,0.15)',
        },
        // Status colors
        'status': {
          green: '#30D158',
          'green-muted': 'rgba(48,209,88,0.15)',
          amber: '#FF9F0A',
          'amber-muted': 'rgba(255,159,10,0.15)',
          red: '#FF453A',
          'red-muted': 'rgba(255,69,58,0.15)',
          purple: '#BF5AF2',
          'purple-muted': 'rgba(191,90,242,0.15)',
          teal: '#40C8E0',
          'teal-muted': 'rgba(64,200,224,0.15)',
        },
        // Algorithm accent colors
        'algo': {
          bfs: '#0A84FF',
          'bfs-muted': 'rgba(10,132,255,0.15)',
          dfs: '#BF5AF2',
          'dfs-muted': 'rgba(191,90,242,0.15)',
          ids: '#30D158',
          'ids-muted': 'rgba(48,209,88,0.15)',
        }
      },
      borderRadius: {
        'apple-sm': '8px',
        'apple': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
        'apple-2xl': '28px',
      },
      backdropBlur: {
        'apple': '20px',
        'apple-sm': '12px',
      },
      boxShadow: {
        'apple-sm': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'apple': '0 4px 16px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)',
        'apple-lg': '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)',
        'apple-inset': 'inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass': '0 0 0 0.5px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.4)',
      },
      animation: {
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    },
  },
  plugins: [],
}
