import { useMemo, useState } from "react";
import QuestionCard from "./components/QuestionCard";
import { createResultsPdf } from "./lib/pdf";

import {
  PARTS,
  OVERALL_RECS_BY_STAGE,
  QUICK_IMPROVEMENTS_BY_STAGE,
  LONG_TERM_GOALS_BY_STAGE,
} from "./content/assessment";

import type { AnswersMap, PartId } from "./types";
import { scorePart, scoreOverall } from "./lib/scoring";

// Debug toggle via ?debug=1
const showDebug = new URLSearchParams(window.location.search).has("debug");

// Brand colors
const COLOR_PROGRESS = "#D100D1";
const COLOR_PROGRESS_BG = "#E5E5E5";

// Stage names (0..6)
const STAGE_NAMES: Record<number, string> = {
  0: "No digitalization",
  1: "Spreadsheets & PPT",
  2: "Centralization & Dashboards",
  3: "Automated Pipelines & Warehouse",
  4: "Real-Time & Governed Platforms",
  5: "Automated Reporting & Alerts",
  6: "Advanced ML/AI Integration",
};

type FlatQ = {
  partId: PartId;
  id: string;
  prompt: string;
  description?: string;
  weight: number;
  answers: { label: string; value: 0 | 1 | 2 | 3 }[];
};

const FLAT: FlatQ[] = PARTS.flatMap((p) =>
  p.questions.map((q) => ({
    partId: p.id,
    id: q.id,
    prompt: q.prompt,
    description: q.description,
    weight: q.weight,
    answers: q.answers,
  }))
);

export default function App() {
  // Intro gate
  const [isIntro, setIsIntro] = useState(true);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);

  // Questionnaire state
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [done, setDone] = useState(false);

  const total = FLAT.length;
  const pct = useMemo(() => (total ? Math.round((index / total) * 100) : 0), [index, total]);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleStart = () => {
    if (!validateEmail(email)) {
      setEmailErr("Please enter a valid email address.");
      return;
    }
    localStorage.setItem("assessmentEmail", email.trim());
    setEmailErr(null);
    setIsIntro(false);
    setIndex(0);
  };

  const onAnswer = (value: 0 | 1 | 2 | 3) => {
    if (!total || index < 0 || index >= total) return;

    const q = FLAT[index];
    const nextAnswers: AnswersMap = { ...answers, [q.id]: value };
    const nextIndex = index + 1;

    if (nextIndex >= total) {
      setAnswers(nextAnswers);
      setDone(true);

      fetch("/api/SubmitResult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: localStorage.getItem("assessmentEmail") ?? "",
          answers: nextAnswers,
          finishedAt: new Date().toISOString(),
        }),
      }).catch(() => {});
    } else {
      setAnswers(nextAnswers);
      setIndex(nextIndex);
    }
  };

  // Compute results once finished
  const results = useMemo(() => {
    if (!done) return null;

    const rawByPartId = PARTS.reduce((acc, p) => {
      const { raw } = scorePart(p, answers);
      acc[p.id] = raw;
      return acc;
    }, {} as Record<PartId, number>);

    const maxByPartId = PARTS.reduce((acc, p) => {
      const max = p.questions.reduce((m, q) => m + 3 * q.weight, 0);
      acc[p.id] = max;
      return acc;
    }, {} as Record<PartId, number>);

    const scaled15ByPartId: Record<PartId, number> = {} as any;
    const contributionByPartId: Record<PartId, number> = {} as any;
    PARTS.forEach((p) => {
      const max = maxByPartId[p.id] || 0;
      const raw = rawByPartId[p.id] || 0;
      const scaled15 = max > 0 ? (raw / max) * 15 : 0;
      scaled15ByPartId[p.id] = scaled15;
      contributionByPartId[p.id] = scaled15 * p.weight;
    });

    const overall = scoreOverall(PARTS, answers);

    const tableRows = PARTS.map((p) => ({
      part: p.title,
      raw: rawByPartId[p.id].toFixed(2),
      max: maxByPartId[p.id].toFixed(2),
      scaled0to15: scaled15ByPartId[p.id].toFixed(2),
      weight: p.weight,
      contribution: contributionByPartId[p.id].toFixed(2),
    }));

    if (showDebug) {
      console.table(tableRows);
      console.log("Overall 0..15 =", overall.overall0to15.toFixed(2), "| Stage =", overall.stage);
    }

    return {
      rawByPartId,
      maxByPartId,
      scaled15ByPartId,
      contributionByPartId,
      overall,
      tableRows,
    };
  }, [done, answers]);

  // 1) Intro screen
  if (isIntro) {
    return (
      <div style={{ maxWidth: 760, margin: "64px auto", padding: "0 16px" }}>
        <h1 style={{ textAlign: "center", color: "#592C89", fontSize: 36, fontWeight: 800 }}>
          Data Maturity Self-Assessment
        </h1>

        <p style={{ textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
          Becoming a data-mature organization is more than a technology investment; it’s a multi-faceted
          mission that touches all corners of your business. Uncover your organization or team’s data maturity.
        </p>

        <div style={{ textAlign: "center", marginTop: 8, opacity: 0.9 }}>
          <span>20 questions</span> · <span>10 minutes</span>
        </div>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            inputMode="email"
            style={{
              width: 420,
              maxWidth: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              outline: "none",
              fontSize: 16,
            }}
          />
          <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
            We’ll only use this to send or reference your assessment results.
          </div>
          {emailErr && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#B00020" }}>{emailErr}</div>
          )}

          <button
            onClick={handleStart}
            style={{
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: COLOR_PROGRESS,
              color: "#fff",
              fontWeight: 700,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  // 2) Finished view
  if (done && results) {
    const stage = results.overall.stage;
    const stageName = STAGE_NAMES[stage] ?? "Unknown stage";
    const rec = OVERALL_RECS_BY_STAGE[stage];
    const quick = QUICK_IMPROVEMENTS_BY_STAGE[stage];
    const longterm = LONG_TERM_GOALS_BY_STAGE[stage];

    const paragraphStyle: React.CSSProperties = {
      marginTop: 12,
      color: "#0A0A0A",
      textAlign: "justify",
      hyphens: "auto",
      lineHeight: 1.5,
    };

    return (
      <div style={{ maxWidth: 680, margin: "72px auto", padding: 24 }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#592C89" }}>
          {`Stage ${stage}: ${stageName}`}
        </div>

        <p style={{ marginTop: 12, color: "#0A0A0A" }}>
          Overall score: <strong>{results.overall.overall0to15.toFixed(2)}</strong>
        </p>

        {rec && <p style={paragraphStyle}>{rec}</p>}
        {quick && (
          <p style={paragraphStyle}>
            <strong>Quick improvements: </strong>
            {quick}
          </p>
        )}
        {longterm && (
          <p style={paragraphStyle}>
            <strong>Long-term goals: </strong>
            {longterm}
          </p>
        )}

        {showDebug && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              border: "1px dashed #bbb",
              borderRadius: 12,
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Debug (not visible to users)</div>
            {results.tableRows.map((r) => (
              <div
                key={r.part}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px repeat(5, auto)",
                  gap: 8,
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
              <strong>Overall 0..15:</strong> {results.overall.overall0to15.toFixed(2)} &nbsp;|&nbsp;
              <strong>Stage:</strong> {results.overall.stage}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={() => {
              createResultsPdf({
                stage,
                stageName,
                score: results.overall.overall0to15,
                recommendation: rec,
                quick,
                longterm,
                tableRows: showDebug ? results.tableRows : [],
              });
            }}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: "#592C89",
              color: "#fff",
              fontWeight: 700,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            Download PDF
          </button>

          <button
            onClick={() => {
              setIndex(0);
              setAnswers({});
              setDone(false);
              setIsIntro(true);
            }}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: COLOR_PROGRESS,
              color: "#fff",
              fontWeight: 700,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            Restart
          </button>
        </div>
      </div>
    );
  }

  // 3) Question view
  if (!total) {
    return (
      <div style={{ maxWidth: 680, margin: "72px auto", padding: 24 }}>
        <h2>Content not found</h2>
        <p>Please check that PARTS is populated.</p>
      </div>
    );
  }
  const current = index >= 0 && index < total ? FLAT[index] : null;
  if (!current) {
    return (
      <div style={{ maxWidth: 680, margin: "72px auto", padding: 24 }}>
        <h2>Loading question…</h2>
      </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div style={{ height: 6, background: COLOR_PROGRESS_BG }}>
        <div
          style={{
            width: `${pct}%`,
            height: 6,
            background: COLOR_PROGRESS,
            transition: "width .2s",
          }}
        />
      </div>

      {/* One question at a time */}
      <QuestionCard
        question={{
          id: current.id,
          prompt: current.prompt,
          description: current.description,
          weight: current.weight,
          answers: current.answers,
        }}
        onAnswer={onAnswer}
        index={index}
        total={total}
      />
    </div>
  );
}

