import type { Question } from "shared";
import { STORAGE_KEY, BACKEND_URL } from "../types";

export async function loadQuestions(): Promise<Question[]> {
  try {
    const data_json = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (data_json.length > 0) return data_json as Question[];

    // load data dari BACKEND_URL
    const res = await fetch(BACKEND_URL);
    if (!res.ok) throw new Error("Failed to fetch");

    const data_be: Question[] = await res.json();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data_be));

    return data_be;
  } catch {
    return [];
  }
}

export function saveQuestions(questions: Question[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

export function editorTemplateToApi(template: string): string {
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