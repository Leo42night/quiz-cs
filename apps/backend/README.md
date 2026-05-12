# Backend
Konfigurasi & dokumentasi backend.

## Database
### Development
Generate/Reset file database & sql migration, jika belum ada `prisma/migrations/`.
```bash
bunx --bun prisma migrate dev --name init
```
Generate code prisma client API (`src/generated/prisma`), Diperlukan ketika fresh clone atau ada perubahan pada `schema.prisma`
```bash
bunx --bun prisma generate
```
```bash
# Memasukkan data baru dari file *.json
bun prisma/seed.ts
# Menjalankan query dari file *.sql
bun prisma/query.ts
# Export database `dev.db` ke file `data.sql` 
sqlite3 dev.db .dump > data.sql
```

### Production 
Sekarang menggunakan turso database.
```bash
# Run script untuk jalankan server backend koneksi ke db turso
bun dev:turso

# `seed.ts` dapat digunakna untuk memasukkan data
# `query.ts` dapat digunakan untuk run query (CRUD) ke database
```

Jalankan [turso CLI](https://docs.turso.tech/cli/introduction) (OS Windows pakai WSL):

```bash
## wsl: login headless
turso auth login --headless
# (ppwl-2026 is DB Name) .dump command to generate all the SQL instructions (DDL and Inserts).
turso db shell ppwl-2026 .dump > data.sql
# masukkna data dari sql ke database
turso db shell ppwl-2026 < data.sql
```

## Backend to Vercel
Deploy dari Web Vercel: buat proyek yang terkoneksi git repo. Beberapa setting yang diperlukan sebelum itu. siapkan file ini di folder backend.

1. **tsdown.config.ts**
Ketika build di vercel, dependency shared harus di bundle (tidak external)
```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  deps: {
    alwaysBundle: ['shared']
  }
})
```

2. **vercel.json**
Vercel bun perlu config khusus untuk backend elysia:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "bunVersion": "1.x",
  "installCommand": "bun install",
  "outputDirectory": "dist"
}
```