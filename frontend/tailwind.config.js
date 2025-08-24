/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#00ff88',
          blue: '#0088ff',
          purple: '#8800ff',
          pink: '#ff0088',
          yellow: '#ffff00',
          cyan: '#00ffff',
        },
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'monospace'],
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(0, 255, 136, 0.8), 0 0 60px rgba(0, 255, 136, 0.4)',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        'glow': {
          'from': {
            textShadow: '0 0 10px rgba(0, 255, 136, 0.8), 0 0 20px rgba(0, 255, 136, 0.6)',
          },
          'to': {
            textShadow: '0 0 20px rgba(0, 255, 136, 1), 0 0 30px rgba(0, 255, 136, 0.8)',
          },
        },
        'slide-up': {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slide-down': {
          'from': {
            opacity: '0',
            transform: 'translateY(-20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 255, 136, 0.5)',
        'neon-strong': '0 0 40px rgba(0, 255, 136, 0.8), 0 0 80px rgba(0, 255, 136, 0.4)',
        'neon-blue': '0 0 20px rgba(0, 136, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(136, 0, 255, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 0, 136, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
}