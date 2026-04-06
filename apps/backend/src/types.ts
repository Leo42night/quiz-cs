type PartType = "code" | "answer";

export interface Part {
  type: PartType;
  value: string;
}

export interface SelectionInfo {
  start: number;
  end: number;
  text: string;
}

export interface QuestionDBType {
  category: number;
  language: number;
  type: number;
  question: string;
  answer: string; // string | string[]
  correct_answer: string; // number | number[] | string | string[]
  difficulty: number;
  points: number;
  updated_at: number;
};

export interface UserMaxType {
  type_1: number;
  type_2: number;
  type_3: number;
  type_4: number;
  phase: number;
}