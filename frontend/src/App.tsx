import { useMemo, useState } from "react";
import QuestionCard from "./components/QuestionCard";
import { PARTS, OVERALL_RECS_BY_STAGE, type PartId } from "./content/assessment";
import { scorePart, scoreOverall, type AnswersMap } from "./lib/scoring";

// Show debug details only when the URL includes ?debug=1
const showDebug = new URLSearchParams(window.location.search).has("debug");

// Your brand colors (already used elsewhere)
const COLOR_PROGRESS = "#D100D1";
const COLOR_PROGRESS_BG = "#E5E5E5"; // a bit darker than #EDEDED so the bar is visible

type FlatQ = {
  partId: PartId;
  id: string;
  prompt: string;
  weight: number;
  answers: { label: string; value: 0 | 1 | 2 | 3 }[];
};

const FLAT: FlatQ[] = PARTS.flatMap((p) =>
  p.questions.map((q) => ({
    partId: p.id,
    id: q.id,
    prompt: q.prompt,
    weight: q.weight,
    answers: q.answers
  }))
);

export default function App() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [done, setDone] = useState(false);

  const total = FLAT.length;
  const pct = useMemo(() => Math.round((index / total) * 100), [index, total]);

  const onAnswer = (value: 0 | 1 | 2 | 3) => {
    const q = FLAT[index];
    const nextAnswers: AnswersMap = { ...answers, [q.id]: value };
    const nextIndex = index + 1;

    if (nextIndex >= total) {
      setAnswers(nextAnswers);
      setDone(true);

      // Optional: send a minimal payload to the backend (you can extend later)
      fetch("/api/SubmitResult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: nextAnswers,
          finishedAt: new Date().toISOString()
        })
      }).catch(() => {});
    } else {
      setAnswers(nextAnswers);
      setIndex(nextIndex);
    }
  };

  // Compute everything only when the user is done
  const results = useMemo(() => {
    if (!done) return null;

    // raw scores by part
    const rawByPartId = PARTS.reduce((acc, p) => {
      const { raw } = scorePart(p.id, answers);
      acc[p.id] = raw;
      return acc;
    }, {} as Record<PartId, number>);

    // max possible per part (for normalization)
    const maxByPartId = PARTS.reduce((acc, p) => {
      const max = p.questions.reduce((m, q) => m + 3 * q.weight, 0);
      acc[p.id] = max;
      return acc;
    }, {} as Record<PartId, number>);

    // scaled 0..15 per part + contribution to overall
    const scaled15ByPartId: Record<PartId, number> = {} as any;
    const contributionByPartId: Record<PartId, number> = {} as any;
    PARTS.forEach((p) => {
      const max = maxByPartId[p.id] || 0;
      const raw = rawByPartId[p.id] || 0;
      const scaled15 = max > 0 ? (raw / max) * 15 : 0;
      scaled15ByPartId[p.id] = scaled15;
      contributionByPartId[p.id] = scaled15 * p.weight;
    });

    const overall = scoreOverall(rawByPartId);

    // Pretty rows for debug
    const tableRows = PARTS.map((p) => ({
      part: p.title,
      raw: rawByPartId[p.id].toFixed(2),
      max: maxByPartId[p.id].toFixed(2),
      scaled0to15: scaled15ByPartId[p.id].toFixed(2),
      weight: p.weight,
      contribution: contributionByPartId[p.id].toFixed(2)
    }));

    if (showDebug) {
      console.table(tableRows);
      console.log(
        "Overall 0..15 =",
        overall.overall0to15.toFixed(2),
        "| Stage =",
        overall.stage
      );
    }

    return { rawByPartId, maxByPartId, scaled15ByPartId, contributionByPartId, overall, tableRows };
  }, [done, answers]);

  // When finished, show the overall stage + optional debug panel
  if (done && results) {
const stage = results.overall.stage;
const rec = OVERALL_RECS_BY_STAGE[
  stage as keyof typeof OVERALL_RECS_BY_STAGE
] as string | { message: string };

return (
  <div style={{ maxWidth: 680, margin: "72px auto", padding: 24 }}>
    <div style={{ fontSize: 48, fontWeight: 800, color: "#592C89" }}>
      {stage}
    </div>
    <p style={{ marginTop: 8, color: "#0A0A0A" }}>
      Overall score (0..15): <strong>{results.overall.overall0to15.toFixed(2)}</strong>
    </p>

    {rec && (
      <p style={{ marginTop: 16, color: "#0A0A0A" }}>
        {typeof rec === "string" ? rec : rec.message}
      </p>
    )}

        {/* Debug panel (only with ?debug=1) */}
        {showDebug && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              border: "1px dashed #bbb",
              borderRadius: 12,
              background: "#fff"
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              Debug (not visible to users)
            </div>
            {results.tableRows.map((r) => (
              <div
                key={r.part}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px repeat(5, auto)",
                  gap: 8
                }}
              >
                <div>{r.part}</div>
                <div>raw: {r.raw}</div>
                <div>max: {r.max}</div>
                <div>scaled0..15: {r.scaled0to15}</div>
                <div>weight: {r.weight}</div>
                <div>contrib: {r.contribution}</div>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <strong>Overall 0..15:</strong>{" "}
              {results.overall.overall0to15.toFixed(2)} &nbsp;|&nbsp;
              <strong>Stage:</strong> {results.overall.stage}
            </div>
          </div>
        )}

        <button
          style={{
            marginTop: 24,
            padding: "12px 16px",
            borderRadius: 12,
            border: "none",
            background: COLOR_PROGRESS,
            color: "#fff",
            fontWeight: 700,
            letterSpacing: 1
          }}
          onClick={() => {
            setIndex(0);
            setAnswers({});
            setDone(false);
          }}
        >
          Restart
        </button>
      </div>
    );
  }

  // Normal question view
  return (
    <div>
      {/* Progress bar */}
      <div style={{ height: 6, background: COLOR_PROGRESS_BG }}>
        <div
          style={{
            width: `${pct}%`,
            height: 6,
            background: COLOR_PROGRESS,
            transition: "width .2s"
          }}
        />
      </div>

      {/* One question at a time */}
      <QuestionCard
        question={{
          id: FLAT[index].id,
          prompt: FLAT[index].prompt,
          weight: FLAT[index].weight,
          answers: FLAT[index].answers
        }}
        onAnswer={onAnswer}
        index={index}
        total={total}
      />
    </div>
  );
}
