// frontend/src/content/assessment.ts
export type Answer = { label: string; value: 0 | 1 | 2 | 3 };
export type Question = {
  id: string;
  prompt: string;
  weight: number;         // per-question weight
  answers: Answer[];
};

export type PartId = "capture" | "storage" | "analytics" | "governance";

export type Part = {
  id: PartId;
  title: string;
  weight: number;         // weight in overall score
  questions: Question[];  // (you will have 5 each later)
  quickTipsByStage: string[]; // 7 items: stage 0..6
};

// Your overall stage bands on a 0..15 scale
export const STAGE_BANDS = [
  { min: 0,  max: 0,  stage: 0 },
  { min: 1,  max: 2,  stage: 1 },
  { min: 3,  max: 5,  stage: 2 },
  { min: 6,  max: 8,  stage: 3 },
  { min: 9,  max: 11, stage: 4 },
  { min: 12, max: 13, stage: 5 },
  { min: 14, max: 15, stage: 6 },
];

// Placeholder overall recommendations per stage (0..6).
export const OVERALL_RECS_BY_STAGE: string[] = [
  "Stage 0: Start with awareness and a quick win.",
  "Stage 1: Build early habits and templates.",
  "Stage 2: Standardize a few use cases.",
  "Stage 3: Measure and scale successful patterns.",
  "Stage 4: Add governance & shared tooling.",
  "Stage 5: Optimize data flows and KPIs.",
  "Stage 6: Track ROI and govern at scale."
];

// Reusable answers (value 0..3)
const A4: Answer[] = [
  { label: "Not at all",      value: 0 },
  { label: "A little",        value: 1 },
  { label: "Comfortable",     value: 2 },
  { label: "Power user",      value: 3 }
];

// Minimal sample questions so you can wire everything now.
// Replace with your full 4×5 set later (keep ids stable).
export const PARTS: Part[] = [
  {
    id: "capture",
    title: "Data Capture",
    weight: 0.35,
    questions: [
      { id: "cap.q1", prompt: "How confident are you using AI tools today?", weight: 1, answers: A4 },
      { id: "cap.q2", prompt: "How standardized are your internal processes?", weight: 1, answers: A4 },
      { id: "cap.q3", prompt: "What’s your data readiness?", weight: 1, answers: A4 },
    ],
    quickTipsByStage: [
      "Tip 0 for Capture", "Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5", "Tip 6"
    ]
  },
  {
    id: "storage",
    title: "Data Storage",
    weight: 0.35,
    questions: [
      { id: "stor.q1", prompt: "Do you centralize your data securely?", weight: 1, answers: A4 },
      { id: "stor.q2", prompt: "How consistent are your data schemas?", weight: 1, answers: A4 },
      { id: "stor.q3", prompt: "Backups and retention policies?", weight: 1, answers: A4 },
    ],
    quickTipsByStage: [
      "Tip 0 for Storage", "Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5", "Tip 6"
    ]
  },
  {
    id: "analytics",
    title: "Analytics",
    weight: 0.18,
    questions: [
      { id: "ana.q1", prompt: "Do teams use dashboards for decisions?", weight: 1, answers: A4 },
      { id: "ana.q2", prompt: "Are experiments/A-B tests common?", weight: 1, answers: A4 },
    ],
    quickTipsByStage: [
      "Tip 0 for Analytics", "Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5", "Tip 6"
    ]
  },
  {
    id: "governance",
    title: "Governance",
    weight: 0.12,
    questions: [
      { id: "gov.q1", prompt: "Are there clear AI usage guidelines?", weight: 1, answers: A4 },
      { id: "gov.q2", prompt: "Do you track compliance & risks?", weight: 1, answers: A4 },
    ],
    quickTipsByStage: [
      "Tip 0 for Governance", "Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5", "Tip 6"
    ]
  }
];

