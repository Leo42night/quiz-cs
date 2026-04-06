# PPWL
```bash
# tambahkan package ke sub workspace
cd <path_sub_workspace> && bun add -D <package_name> # -D jika ingin save di devDependency 

# hapus file dari history commit
git filter-repo --path <path/to/file> --invert-paths
```

## Add Soal
- run `bun dev`
- masuk ke `<frontend-url>/kelola-soal`
- Create soal baru
- jika ada update, akan ada riwayat update
- filter berdasarkan rentang waktu yang hanya memuat data update terbaru.
- klik `Copy Semua JSON` yang akan copy isi filter tersebut.
- pastekan di `apps/backend/quiz-update.json`
- run `cd apps/backend && bun db-prod:seed` (data akan di update ke turso database)
