import { defineConfig } from 'tsdown'

export default defineConfig({
  deps: {
    // bundling file diluar root folder proyek (vercel -> apps/backend)
    alwaysBundle: ['shared']
  }
})