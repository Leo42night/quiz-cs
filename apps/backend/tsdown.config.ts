import { defineConfig } from 'tsdown'

export default defineConfig({
  external: [
    '@prisma/client',
    '.prisma/client',
    '@prisma/adapter-libsql',
    '@libsql/client'
  ],
  deps: {
    alwaysBundle: ['shared']
  }
})