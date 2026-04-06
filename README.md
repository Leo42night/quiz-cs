# PPWL
```bash
# tambahkan package ke sub workspace
cd <path_sub_workspace> && bun add -D <package_name> # -D jika ingin save di devDependency 

# hapus file dari history commit
git filter-repo --path <path/to/file> --invert-paths
```

## Add Soal
### Cara 1: Bulk Update
- Jalankan `bun dev`, tambahkan soal yang dibutuhkan.
- Lakukan test soal di halaman `<frontend-url>/test-question/:id` 
- Copy cURL tiap soal, simpan ke file `add-q.sh` 
- Matikan server, jalankan `bun dev:turso` (koneksi ke db turso)
- run `add-q.sh` untuk create data question ke DB Turso! (OS Windows bisa pakai Git Bash).

### Cara 2: Single Update
- run `bun dev:turso` 
- Perbaiki soal di halaman `<frontend-url>/kelola-soal` 