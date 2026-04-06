# PPWL
```bash
# tambahkan package ke sub workspace
cd <path_sub_workspace> && bun add -D <package_name> # -D jika ingin save di devDependency 

# hapus file dari history commit
git filter-repo --path <path/to/file> --invert-paths
```

## Add Soal
- Jalankan `bun dev`, tambahkan soal yang dibutuhkan.
- Copy cURL tiap soal, simpan ke file `add-q.sh` 
- Matikan server, jalankan `bun dev:turso` (koneksi ke db turso)
- run `add-q.sh` untuk create data question ke DB Turso! (OS Windows bisa pakai Git Bash).
