export type QuestionType = 1 | 2 | 3 | 4;

export interface BaseQuestion {
  id: number;
  type: QuestionType;
  category: 1 | 2 | 3 | 4;
  language: 1 | 2 | 3 | 4;
  difficulty: 1 | 2 | 3;
  points: number;
  question: string;
}

export interface QuizSingleQuestion extends BaseQuestion {
  type: 1;
  answer: string[];
  correct_answer: number;
}

export interface QuizMultiQuestion extends BaseQuestion {
  type: 2;
  answer: string[];
  correct_answer: number[];
}

export interface CodeFillExactQuestion extends BaseQuestion {
  type: 3;
  answer: string;
  correct_answer: string[];
}

export interface CodeFillRegexQuestion extends BaseQuestion {
  type: 4;
  answer: string;
  correct_answer: string;
}

export type Question =
  | QuizSingleQuestion
  | QuizMultiQuestion
  | CodeFillExactQuestion
  | CodeFillRegexQuestion;

export interface AnsweredLog {
  user_id: number;
  question_id: number;
}

export const STORAGE_KEY = "quiz_questions";
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function loadQuestions(): Question[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
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