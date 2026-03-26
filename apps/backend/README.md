# deploy database
Development (ingin ada history migrasi, jika ingin berganti)
```bash
bunx prisma migrate dev --name init
```

Production: langsung ubah skema database tanpa riwayat migrasi.
```bash
bunx prisma db push
bunx prisma db execute --file file.sql # eksekusi query
bun prisma/seed.ts # seeder ulang
sqlite3 db.sqlite .dump > data.sql # export to sql
bunx prisma db execute --file file.sql && bun prisma/seed.ts && sqlite3 db.sqlite .dump > data.sql
# Jika ada perubahan `schema.prisma`, jalankan:
bunx prisma generate
```

Jalankan [turso CLI](https://docs.turso.tech/cli/introduction) DB production (pakai wsl jika di windows):
```bash
sqlite3 db.sqlite .dump > data.sql # export to sql
turso db shell ppwl-2026 < baseline.sql # reset ulang
turso db shell ppwl-2026 < data.sql # push data baru
```

# Backend to Vercel
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