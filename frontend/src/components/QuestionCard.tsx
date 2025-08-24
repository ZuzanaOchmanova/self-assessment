import type { Question } from "../types";

type Props = {
  question: Question;
  onAnswer: (value: number) => void;
  index: number;
  total: number;
};

export default function QuestionCard({ question, onAnswer, index, total }: Props) {
  return (
    <div style={{ maxWidth: 680, margin: "72px auto", padding: 24 }}>
      <div style={{ opacity: 0.75, marginBottom: 8 }}>
        Question {index + 1} of {total}
      </div>
      <h1 style={{ margin: "8px 0 24px", color: "#592C89" }}>{question.prompt}</h1>
      <div style={{ display: "grid", gap: 16 }}>
        {question.answers.map((a, i) => (
          <button
            key={i}
            onClick={() => onAnswer(a.value)}
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              border: "1px solid #ddd",
              textAlign: "left",
              cursor: "pointer",
              background: "white",
              fontSize: "16px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#f5f5f5")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "white")
            }
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}


