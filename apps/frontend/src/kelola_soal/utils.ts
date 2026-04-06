import { BACKEND_URL } from "@/constants";
import { type Question } from "shared";

export function extractAnswersFromTemplate(template: string): string[] {
  return Array.from(template.matchAll(/\[ANS:([^\]]*)\]/g)).map((m) => m[1]);
}

// START -- export to FormPage.tsx --
export async function updateQuestion(id: number, question: Omit<Question, "id">): Promise<Response> {
  const resQ = await fetch(`${BACKEND_URL}/api/questions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(question),
  });
  return resQ;
}

export async function saveQuestionToDB(question: Omit<Question, "id">): Promise<Response> {
  const resQ = await fetch(`${BACKEND_URL}/api/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(question),
  });
  return resQ;
}

export const FILTER_STORAGE_KEY = "daftar_soal_filters";
// END -- export to FormPage.tsx --