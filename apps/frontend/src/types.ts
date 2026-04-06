export interface AnsweredLog {
  user_id: number;
  question_id: number;
}

export const QUESTION_STORAGE_KEY = "qs";
export const NEW_ANS_Q_IDS_STORAGE_KEY = "naqis";
export const ANS_Q_IDS_STORAGE_KEY = "aqis";
export const NOT_ANS_Q_IDS_STORAGE_KEY = "notaqis";
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;