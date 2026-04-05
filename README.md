# PPWL
```bash
# tambahkan package ke sub workspace
cd <path_sub_workspace> && bun add -D <package_name> # -D jika ingin save di devDependency 

# hapus file dari history commit
git filter-repo --path <path/to/file> --invert-paths
```

## Job
- v1.0.0: score validation di backend, CRUD questions