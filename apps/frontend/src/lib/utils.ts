import { Cipher, STORAGE_KEY, type Question } from "shared";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { BACKEND_URL } from "@/constants";

function normalizeQuestion(q: any): Question {
  const answer =
    (q.type === 1 || q.type === 2) && typeof q.answer === "string"
      ? JSON.parse(q.answer)
      : q.answer;

  return { ...q, answer };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function loadQuestions(): Question[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export async function syncQuestions(
  setQuestions: (qs: Question[]) => void
): Promise<void> {
  // 1. Cek local storage dulu, kalau sudah ada (dan tidak kosong), 
  // ambil dari sana saja supaya cepat (Sesuai logika yang kamu minta)
  const localData = localStorage.getItem("questions");
  if (localData && localData !== "[]") {
    const parsed = JSON.parse(localData).map(normalizeQuestion);
    setQuestions(parsed);
    return;
  }

  // 2. Jika tidak ada di local storage, ambil dari backend
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // Pastikan ini terdefinisi
    if (!BACKEND_URL) throw new Error("BACKEND_URL is undefined");

    const resQ = await fetch(`${BACKEND_URL}/api/questions`);
    if (!resQ.ok) throw new Error("Failed to fetch questions");

    const fetchedQ = await resQ.json();

    // 3. Dekripsi dan Normalisasi
    const decodeQuestions = Cipher.decode(fetchedQ.data, import.meta.env.VITE_SEED);
    const normalized = safeParse(decodeQuestions, []).map(normalizeQuestion);

    // 4. Update State dan LocalStorage
    setQuestions(normalized);
    localStorage.setItem("questions", JSON.stringify(normalized));

  } catch (err) {
    toast.error(`Gagal load questions: ${err}`);
    console.error("Initialization failed", err);
  }
}

export function saveQuestions(questions: Question[]): void {
  localStorage.setItem("questions", JSON.stringify(questions));
}

export async function saveQuestion(question: Omit<Question, "id">): Promise<Response> {
  const resQ = await fetch(`${BACKEND_URL}/api/questions?key=${import.meta.env.VITE_SECRET_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(question),
  });
  return resQ;
}

export async function updateQuestion(id: number, question: Omit<Question, "id">): Promise<Response> {
  const resQ = await fetch(`${BACKEND_URL}/api/questions/${id}?key=${import.meta.env.VITE_SECRET_KEY}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(question),
  });
  return resQ;
}

export function editorTemplateToApi(template: string): string {
  // console.log("template", template);
  return template
    .replace(/\[ANS:([^\]]*)\]/g, (_m, ans: string) => `<<${Math.max(ans.length, 4)}>>`)
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
}

export function apiTemplateToEditor(apiAnswer: string, answers: string[]): string {
  let i = 0;
  return apiAnswer
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/<<\d+>>/g, () => `[ANS:${answers[i++] ?? ""}]`);
}

export function extractAnswersFromTemplate(template: string): string[] {
  return Array.from(template.matchAll(/\[ANS:([^\]]*)\]/g)).map((m) => m[1]);
}

export function formatArray(array: any) {
  return Array.isArray(array) ? JSON.stringify(array) : array;
}

export function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Mengecek apakah data adalah string yang berisi array JSON
 */
// 1. Cek apakah tipe datanya string
// // --- Test Cases ---
// console.log(isJsonArray(1));                         // false
// console.log(isJsonArray("Halo"));                    // false
// console.log(isJsonArray("[\"Elysia\",\"listen\"]")); // true
// console.log(isJsonArray("[1, 2, 3]"));               // true
// console.log(isJsonArray("{ \"key\": \"val\" }"));    // false (ini object)


// ----- QuestionPage -----

export function validateAnswer(question: Question, answer: any) {
  if (answer === null || answer === undefined) return false;
  // console.log("validateAnswer", question, answer);

  switch (question.type) {
    case 1:
      return typeof answer === "number";
    case 2:
      return Array.isArray(answer) && answer.length > 0;
    case 3:
      return Array.isArray(answer) && answer.length > 0 && answer.every((a: string) => a.trim() !== "");
    case 4:
      // answer string[]
      return (typeof answer === "string" && answer.trim() !== "") || (Array.isArray(answer) && answer.length > 0);
    default:
      return false;
  }
}