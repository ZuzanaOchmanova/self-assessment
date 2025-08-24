import { useMemo, useState } from "react";
import QuestionCard from "./components/QuestionCard";
import { QUESTIONS } from "./questions";

function computeTier(total: number) {
  if (total <= 2) return { tier: "Starter", message: "You're at the beginning—focus on awareness and small wins." };
  if (total <= 5) return { tier: "Emerging", message: "Great! Build consistency and standardize a few use cases." };
  if (total <= 7) return { tier: "Mature", message: "You’re close—scale practices and measure impact." };
  return { tier: "Leader", message: "Excellent! Double down on governance and ROI tracking." };
}

export default function App() {
  const [index, setIndex] = useState(0);
  const [sum, setSum] = useState(0);
  const [done, setDone] = useState(false);

  const total = QUESTIONS.length;
  const pct = useMemo(() => Math.round((index / total) * 100), [index, total]);

  function onAnswer(value: number) {
    const nextSum = sum + value;
    const nextIndex = index + 1;
    if (nextIndex >= total) {
      setSum(nextSum);
      setDone(true);
      // Send to backend (optional)
      fetch("/api/SubmitResult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total: nextSum, timestamp: new Date().toISOString() })
      }).catch(() => {});
    } else {
      setSum(nextSum);
      setIndex(nextIndex);
    }
  }

  if (done) {
    const { tier, message } = computeTier(sum);
    return (
      <div style={{ maxWidth: 680, margin: "72px auto", padding: 24 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: "var(--question)" }}>{tier}</div>
        <p style={{ marginTop: 8, fontSize: 18 }}>Your score: <strong>{sum}</strong></p>
        <p style={{ marginTop: 16, fontSize: 16 }}>{message}</p>
        <button
          style={{
            marginTop: 24,
            padding: "14px 24px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: "var(--brand)",
            color: "white",
            fontSize: 16,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
          }}
          onClick={() => { setIndex(0); setSum(0); setDone(false); }}
        >
          Restart
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div style={{ height: 4, background: "#eee" }}>
        <div
          style={{
            width: `${pct}%`,
            height: 4,
            background: "var(--brand)",
            transition: "width .2s"
          }}
        />
      </div>

      <QuestionCard
        question={QUESTIONS[index]}
        onAnswer={onAnswer}
        index={index}
        total={total}
      />
    </div>
  );
}
