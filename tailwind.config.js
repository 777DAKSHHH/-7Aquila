/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        background: 'var(--color-background)', /* gray-50 / gray-900 */
        foreground: 'var(--color-foreground)', /* gray-700 / white-90% */
        primary: {
          DEFAULT: 'var(--color-primary)', /* Deep academic navy / Lighter slate */
          foreground: 'var(--color-primary-foreground)', /* white */
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)', /* Muted slate blue / gray-800 */
          foreground: 'var(--color-secondary-foreground)', /* white */
        },
        accent: {
          DEFAULT: 'var(--color-accent)', /* Warm gold / Warmer gold */
          foreground: 'var(--color-accent-foreground)', /* near-black */
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)', /* red-600 / red-400 */
          foreground: 'var(--color-destructive-foreground)', /* white */
        },
        success: {
          DEFAULT: 'var(--color-success)', /* green-600 / green-500 */
          foreground: 'var(--color-success-foreground)', /* white */
        },
        warning: {
          DEFAULT: 'var(--color-warning)', /* yellow-600 / yellow-500 */
          foreground: 'var(--color-warning-foreground)', /* near-black / gray-800 */
        },
        error: {
          DEFAULT: 'var(--color-error)', /* red-600 / red-400 */
          foreground: 'var(--color-error-foreground)', /* white */
        },
        muted: {
          DEFAULT: 'var(--color-muted)', /* gray-100 / gray-700 */
          foreground: 'var(--color-muted-foreground)', /* gray-500 / gray-400 */
        },
        card: {
          DEFAULT: 'var(--color-card)', /* white / gray-800 */
          foreground: 'var(--color-card-foreground)', /* gray-700 / white-90% */
        },
        popover: {
          DEFAULT: 'var(--color-popover)', /* white / gray-700 */
          foreground: 'var(--color-popover-foreground)', /* gray-700 / white-90% */
        },
      },
      fontFamily: {
        heading: ['Source Serif Pro', 'serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
        caption: ['Karla', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'h1': ['2.25rem', { lineHeight: '1.2' }],
        'h2': ['1.875rem', { lineHeight: '1.25' }],
        'h3': ['1.5rem', { lineHeight: '1.3' }],
        'h4': ['1.25rem', { lineHeight: '1.4' }],
        'h5': ['1.125rem', { lineHeight: '1.5' }],
        'caption': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.025em' }],
      },
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
      transitionDuration: {
        'base': '250ms',
      },
      transitionTimingFunction: {
        'base': 'ease-out',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scale-in': 'scale-in 200ms ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
}