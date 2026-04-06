import { Cipher, type Question } from "shared";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { QUESTION_STORAGE_KEY } from "@/constants";

export function normalizeQuestion(q: any): Question {
  const answer =
    (q.type === 1 || q.type === 2) && typeof q.answer === "string"
      ? JSON.parse(q.answer)
      : q.answer;

  return { ...q, answer };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

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

export function saveQuestionsToLocal(questions: Question[]): void {
  const encodeQuestions = Cipher.encode(JSON.stringify(questions), import.meta.env.VITE_SEED);
  localStorage.setItem(QUESTION_STORAGE_KEY, encodeQuestions);
}