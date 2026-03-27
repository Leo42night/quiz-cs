import { defineConfig } from 'tsdown'

export default defineConfig({
  deps: {
    // bundling file diluar root folder proyek (vercel -> apps/backend)
    alwaysBundle: ['shared'],
    // Tandai path generated sebagai external agar tetap dicari di filesystem saat runtime
    neverBundle: ['../src/generated/prisma/client']
  }
})