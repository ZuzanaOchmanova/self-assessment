import type { AnswersMap, Part } from "../types";

export type PartScore = {
  partId: Part["id"];
  raw: number;
  max: number;
  scaled0to15: number;
  weight: number;
  contribution: number;
};

export function scorePart(part: Part, answers: AnswersMap): PartScore {
  let raw = 0;
  let max = 0;

  for (const q of part.questions) {
    const v = answers[q.id] ?? 0;
    raw += v * q.weight;
    max += 3 * q.weight;
  }

  const scaled0to15 = max > 0 ? (raw / max) * 15 : 0;
  const contribution = scaled0to15 * part.weight;

  return { partId: part.id, raw, max, scaled0to15, weight: part.weight, contribution };
}

export function scoreOverall(parts: Part[], answers: AnswersMap) {
  const partScores = parts.map((p) => scorePart(p, answers));
  const overall0to15 = partScores.reduce((s, p) => s + p.contribution, 0);

  // Stage mapping based on PDF spec
  let stage: number;
  if (overall0to15 === 0) stage = 0;
  else if (overall0to15 <= 2) stage = 1;
  else if (overall0to15 <= 5) stage = 2;
  else if (overall0to15 <= 8) stage = 3;
  else if (overall0to15 <= 11) stage = 4;
  else if (overall0to15 <= 13) stage = 5;
  else stage = 6;

  return { overall0to15, stage, partScores };
}

