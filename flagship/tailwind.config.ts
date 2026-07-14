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
        brand: {
          DEFAULT: '#111111',
          50: '#f5f5f5',
          100: '#e8e8e8',
        },
        status: {
          available: '#E6F1FB',
          'available-text': '#185FA5',
          reserved: '#FAEEDA',
          'reserved-text': '#854F0B',
          sold: '#EAF3DE',
          'sold-text': '#3B6D11',
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
