// frontend/src/lib/scoring.ts
import { PARTS, STAGE_BANDS } from "../content/assessment";
import type { PartId } from "../content/assessment";

export type AnswersMap = Record<string, 0 | 1 | 2 | 3>;

export function scorePart(partId: PartId, answers: AnswersMap) {
  const part = PARTS.find(p => p.id === partId)!;
  const raw = part.questions.reduce((sum, q) => {
    const v = answers[q.id] ?? 0;
    return sum + v * q.weight;
  }, 0);
  return { part, raw };
}

export function stageFromRaw(raw: number) {
  const band = STAGE_BANDS.find(b => raw >= b.min && raw <= b.max) ?? STAGE_BANDS[0];
  return band.stage;
}

export function scoreOverall(rawByPartId: Record<PartId, number>) {
  // Normalize each part to 0..15, then weight by part.weight
  const scaled = PARTS.map(p => {
    const max = p.questions.reduce((m, q) => m + 3 * q.weight, 0);
    const raw = rawByPartId[p.id] ?? 0;
    const scaledTo15 = max > 0 ? (raw / max) * 15 : 0;
    return scaledTo15 * p.weight;
  });

  const overall0to15 = scaled.reduce((a, b) => a + b, 0);
  const band = STAGE_BANDS.find(b => overall0to15 >= b.min && overall0to15 <= b.max) ?? STAGE_BANDS[0];
  return { overall0to15, stage: band.stage };
}

