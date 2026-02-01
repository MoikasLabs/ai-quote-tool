import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#d6e0fd',
          300: '#b3c5fb',
          400: '#8aa0f8',
          500: '#667eea',
          600: '#5568d3',
          700: '#4553b8',
          800: '#3a4595',
          900: '#323b7a',
        },
        secondary: {
          500: '#764ba2',
          600: '#6a4391',
          700: '#5e3b80',
        },
      },
      keyframes: {
        bounce: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'bounce-dot': 'bounce 1.4s infinite ease-in-out both',
      },
    },
  },
  plugins: [],
}

export default config
