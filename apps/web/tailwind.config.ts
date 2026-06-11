import type { Config } from 'tailwindcss'
import { sharedConfig } from '@grocery-savings/ui-web/tailwind.config'

const config: Config = {
  ...sharedConfig,
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui-web/src/**/*.{js,ts,jsx,tsx}',
  ],
}

export default config
