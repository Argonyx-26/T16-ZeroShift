/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F9FC',
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#F8FAFC',
        },
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#60A5FA',
          soft: '#EFF6FF',
        },
        learning: {
          DEFAULT: '#22C55E',
          hover: '#16A34A',
          soft: '#ECFDF3',
        },
        warning: {
          DEFAULT: '#F59E0B',
          soft: '#FFFBEB',
        },
        error: {
          DEFAULT: '#EF4444',
          soft: '#FEF2F2',
        },
        ink: {
          DEFAULT: '#202938',
          secondary: '#667085',
          muted: '#94A3B8',
          border: '#E5E7EB',
          dark: '#0F172A',
        },
      },
      fontFamily: {
        pixel: ['"Pixelify Sans"', '"Press Start 2P"', 'monospace'],
        arcade: ['"Press Start 2P"', 'monospace'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'pixel': '3px 3px 0px 0px #1E293B',
        'pixel-lg': '5px 5px 0px 0px #1E293B',
        'pixel-sm': '2px 2px 0px 0px #1E293B',
        'pixel-blue': '3px 3px 0px 0px #2563EB',
        'pixel-green': '3px 3px 0px 0px #16A34A',
        'pixel-yellow': '3px 3px 0px 0px #D97706',
        'card-soft': '0 4px 20px -2px rgba(37, 99, 235, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        'pixel': '12px',
        'pixel-lg': '18px',
        'pixel-xl': '24px',
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'bounce-subtle': 'bounceSubtle 2.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      }
    },
  },
  plugins: [],
}
