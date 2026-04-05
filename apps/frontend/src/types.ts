export interface AnsweredLog {
  user_id: number;
  question_id: number;
}

export const STORAGE_KEY = "quiz_questions";
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;