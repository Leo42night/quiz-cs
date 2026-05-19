# PPWL
<!-- Foto UI Quiz (4 tipe soal) -->
Aplikasi PPWL, berisi fitur Quiz (4 tipe: Single, Multi, CodeFill, CodeRegex) & Kelola Quiz.

> Use-Case: Dipakai sebagai tugas pengganti *student* program CS yang ingin menambal nilai.

## Stack
- Monorepo pakai BunJS (language Typescript).
    - FE: React, Vite, Tailwind.
    - BE: ElysiaJs, Prisma DB (SQLite).
    - `pakcages/shared` utnuk informasi data gabungan.
- Deploy FE & BE ke Vercel.

## Feature
- Login pakai Google OAuth (verifikasi user student.untan.ac.id).
- Akses data di backend pakai security url query key di browser.
- View UI, Jika Sesi Quiz sudah berakhir (`CApp.tsx`, ganti './App' jadi './CApp' di `main.tsx`).
- Konfigurasi Deployment Vercel (`vercel.json`) untuk BE.

## Setup
```bash
# 1. setup `apps\backend\.env.template` dan `apps\frontend\.env.template`
# -- ganti dengan nama env yang tepat & isiannya
# 2. Install Package
bun install
# 3. Setup backend prisma migration dev & generate client
cd apps/backend 
bun prisma migrate dev --name init
bun prisma generate
# 4. modifikasi `apps\backend\prisma\seed.ts`, siapkan data student & questions.
bun prisma/seed.ts
# Saran: Pakai HeidiSQL untuk Kelola database `dev.db` & di production.
```
- Lihat `apps\backend\prisma\schema.prisma` untuk tau data student yg diperlukan.
- Lihat `apps\frontend\src\constants.ts` untuk tau format quiz & bagaimana code menyesuaikan struktur quiz tersebut.
- Contoh data json untuk seed ada di `apps/backend/data`
- Lihat kode di `dev/` untuk melakukan operasi khusus pada soal.

## Add Soal di Dev ke Prod
- run `bun dev`
- masuk ke `<frontend-url>/kelola-soal`
- Create soal baru
- jika ada update, akan ada riwayat update
- filter berdasarkan rentang waktu yang hanya memuat data update terbaru.
- klik `Copy Semua JSON` yang akan copy isi filter tersebut.
- pastekan di `apps/backend/data/quiz-new.json` (jaga jaga jika butuh backup). 
- run `cd apps/backend && bun db-prod:seed` (data akan di update ke turso database).

## Tools
```bash
# tambahkan package ke sub workspace
cd <path_sub_workspace> && bun add -D <package_name> # -D jika ingin save di devDependency 

# hapus file dari history commit
git filter-repo --path <path/to/file> --invert-paths
```