export const CATEGORIES: Record<number, string> = {
  1: "BunJS",
  2: "TailwindCSS",
  3: "Git & Github",
  4: "ElysiaJS",
  5: "Docker"
};

export const LANGUAGES: Record<number, string> = {
  1: "TypeScript",
  2: "CSS",
  3: "Bash",
  4: "HTML",
};

export const HL_LANGUAGES: Record<number, string> = {
  1: "typescript",
  2: "css",
  3: "bash",
  4: "html",
};

export const TYPE_LABELS: Record<number, string> = {
  1: "Single Quiz",
  2: "Multi Quiz",
  3: "Code Fill Exact",
  4: "Code Fill Regex",
};

export const TYPE_COLORS: Record<number, string> = {
  1: "bg-blue-50 text-blue-700",
  2: "bg-green-50 text-green-700",
  3: "bg-amber-50 text-amber-700",
  4: "bg-red-50 text-red-700",
};

export const TIME_LIMIT = 20;
export const SECRET_KEY = import.meta.env.VITE_SECRET_KEY
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
// src/config/storageVersion.ts
export const STORAGE_VERSION = "1.0.1"; // Ubah ini setiap deploy yang perlu reset