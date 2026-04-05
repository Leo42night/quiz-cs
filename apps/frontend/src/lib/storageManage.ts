import { STORAGE_VERSION } from "../constants";

export function checkAndMigrateStorage(): void {
  const savedVersion = localStorage.getItem("__app_storage_version__");
  if (savedVersion !== STORAGE_VERSION) {
    // Versi berbeda atau belum ada → clear semua
    localStorage.clear();

    // Simpan versi baru setelah clear
    localStorage.setItem("__app_storage_version__", STORAGE_VERSION);

    console.info(`Storage reset: ${savedVersion ?? "none"} → ${STORAGE_VERSION}`);
  }
}