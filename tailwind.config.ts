import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B1B1F',
        bg: '#FAF6E8',
        bgDark: '#2B1149',
        bgDark2: '#3B1A63',
        cream: '#FBF3D9',
        yellow: '#F4B400',
        yellowDark: '#8A5D00',
        purple: '#6B2FA6',
        purpleDark: '#2B1149',
        purpleLight: '#9B6FD1',
        tomato: '#C1442E',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};

export default config;
