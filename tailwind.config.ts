import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        'background-secondary': 'var(--background-secondary)',
        'foreground-secondary': 'var(--foreground-secondary)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
      },
    },
  },
  plugins: [],
}

export default config