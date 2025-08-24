// frontend/src/components/QuestionCard.tsx
import type { Question } from "../types";

type Props = {
  question: Question;
  onAnswer: (value: 0 | 1 | 2 | 3) => void;
  index: number;
  total: number;
};

export default function QuestionCard({ question, onAnswer, index, total }: Props) {
  return (
    <div style={{ maxWidth: 680, margin: "72px auto", padding: 24 }}>
      <div style={{ opacity: 0.75, marginBottom: 8 }}>
        Question {index + 1} of {total}
      </div>

      <h1 style={{ margin: "8px 0 8px", color: "#592C89" }}>{question.prompt}</h1>

      {/* 👇 description now rendered if present */}
      {question.description && (
        <p
          style={{
            marginTop: 0,
            marginBottom: 16,
            color: "#6B6B6B",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {question.description}
        </p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {question.answers.map((a, i) => (
          <button
            key={i}
            onClick={() => onAnswer(a.value)}
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid #ddd",
              textAlign: "left",
              background: "white",
              cursor: "pointer",
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
