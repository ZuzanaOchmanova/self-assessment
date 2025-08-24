// frontend/src/types.ts

export type PartId = "capture" | "storage" | "analytics" | "governance";

export type AnswerValue = 0 | 1 | 2 | 3;

export type AnswerOption = {
  label: string;
  value: AnswerValue;
};

export type Question = {
  id: string;
  prompt: string;
  description?: string;        // ← add this
  weight: number;
  answers: { label: string; value: 0 | 1 | 2 | 3 }[];
};

export type Part = {
  id: PartId;
  title: string;
  /** Part weight in overall calculation */
  weight: number;
  questions: Question[];
};

export type AnswersMap = Record<string, AnswerValue>;
