import { useMemo, useState } from "react";
import QuestionCard from "./components/QuestionCard";
import { PARTS, OVERALL_RECS_BY_STAGE, type PartId } from "./content/assessment";
import { scorePart, scoreOverall, type AnswersMap } from "./lib/scoring";

// Flatten all questions so we can keep the one-question-at-a-time flow
type FlatQ = {
  partId: PartId;
  id: string;
  prompt: string;
  weight: number; // <-- add this
  answers: { label: string; value: 0 | 1 | 2 | 3 }[];
};

const FLAT: FlatQ[] = PARTS.flatMap((p) =>
  p.questions.map((q) => ({
    partId: p.id,
    id: q.id,
    prompt: q.prompt,
    weight: q.weight,     // <-- carry it through
    answers: q.answers
  }))
);

export default function App() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [done, setDone] = useState(false);

  const total = FLAT.length;
  const pct = useMemo(() => Math.round((index / total) * 100), [index, total]);

  function onAnswer(value: 0 | 1 | 2 | 3) {
    const q = FLAT[index];
    const nextAnswers: AnswersMap = { ...answers, [q.id]: value };

    const nextIndex = index + 1;
    if (nextIndex >= total) {
      setAnswers(nextAnswers);
      setDone(true);

      // Optional: send to backend (now with the answers map)
      fetch("/api/SubmitResult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: nextAnswers,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    } else {
      setAnswers(nextAnswers);
      setIndex(nextIndex);
    }
  }

  // When done, compute per-part + overall scores
  const results = useMemo(() => {
    if (!done) return null;

    const rawByPartId = PARTS.reduce((acc, p) => {
      const { raw } = scorePart(p.id, answers);
      acc[p.id] = raw;
      return acc;
    }, {} as Record<PartId, number>);

    const overall = scoreOverall(rawByPartId);
    return { rawByPartId, overall };
  }, [done, answers]);

  if (done && results) {
    const stage = results.overall.stage;
    const message = OVERALL_RECS_BY_STAGE[stage] ?? "";

    return (
      <div style={{ maxWidth: 680, margin: "72px auto", padding: 24 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: "#592C89" }}>
          Overall Stage {stage}
        </div>
        <p style={{ marginTop: 8, color: "#0A0A0A" }}>{message}</p>

        {/* Temporary per-part debug (keeps design simple for now) */}
        <div style={{ marginTop: 24 }}>
          {PARTS.map((p) => (
            <div key={p.id} style={{ marginBottom: 8 }}>
              <strong>{p.title}:</strong> raw {results.rawByPartId[p.id].toFixed(2)}
            </div>
          ))}
        </div>

        <button
          style={{
            marginTop: 24,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#D100D1",
            color: "white",
            fontWeight: 700,
            cursor: "pointer"
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

  // Question view (unchanged style; just reading from FLAT)
  return (
    <div>
      <div style={{ height: 4, background: "#eee" }}>
        <div
          style={{
            width: `${pct}%`,
            height: 4,
            background: "#D100D1",
            transition: "width .2s"
          }}
        />
      </div>

   <QuestionCard
  question={{
    id: FLAT[index].id,
    prompt: FLAT[index].prompt,
    weight: FLAT[index].weight,   // <-- pass weight so it matches the type
    answers: FLAT[index].answers
  }}
  onAnswer={onAnswer}
  index={index}
  total={total}
/>
    </div>
  );
}

