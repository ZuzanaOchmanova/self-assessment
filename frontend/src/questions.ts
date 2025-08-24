import type { Question } from "./types";

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt: "How confident are you using AI tools today?",
    answers: [
      { label: "Not at all", value: 0 },
      { label: "A little", value: 1 },
      { label: "Comfortable", value: 2 },
      { label: "Power user", value: 3 }
    ]
  },
  {
    id: "q2",
    prompt: "How standardized are your internal processes?",
    answers: [
      { label: "Not standardized", value: 0 },
      { label: "Some standards", value: 1 },
      { label: "Mostly standardized", value: 2 },
      { label: "Fully standardized", value: 3 }
    ]
  },
  {
    id: "q3",
    prompt: "What’s your data readiness?",
    answers: [
      { label: "Scattered", value: 0 },
      { label: "Some structure", value: 1 },
      { label: "Well structured", value: 2 },
      { label: "Centralized & governed", value: 3 }
    ]
  }
];
