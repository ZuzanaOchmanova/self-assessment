import { useMemo, useState, useEffect } from "react";
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

// If you know your concrete PartIds, list them here to get strong typing:
const PID = {
  dataCapture: "dataCapture" as PartId,
  storInteg: "storInteg" as PartId,
  analyReport: "analyReport" as PartId,
  govAuto: "govAuto" as PartId,
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

// Map a 0..15 score to stage 0..6.
// (Same breakpoints as overall; adjust if your scoring uses a different mapping.)
function scoreToStage(score0to15: number): number {
  const bucket = 15 / 6; // 2.5 each
  const n = Math.round(score0to15 / bucket);
  return Math.max(0, Math.min(6, n));
}

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
      // We POST after results are computed (see useEffect below)
    } else {
      setAnswers(nextAnswers);
      setIndex(nextIndex);
    }
  };

  // Compute results once finished
  const results = useMemo(() => {
    if (!done) return null;

    // Raw per-part score (weighted)
    const rawByPartId = PARTS.reduce((acc, p) => {
      const { raw } = scorePart(p, answers);
      acc[p.id] = raw;
      return acc;
    }, {} as Record<PartId, number>);

    // Max per-part score (all answers = 3)
    const maxByPartId = PARTS.reduce((acc, p) => {
      const max = p.questions.reduce((m, q) => m + 3 * q.weight, 0);
      acc[p.id] = max;
      return acc;
    }, {} as Record<PartId, number>);

    // Scale to 0..15 per part
    const scaled15ByPartId: Record<string, number> = {};
    PARTS.forEach((p) => {
      const max = maxByPartId[p.id] || 0;
      const raw = rawByPartId[p.id] || 0;
      const scaled15 = max > 0 ? (raw / max) * 15 : 0;
      scaled15ByPartId[p.id] = scaled15;
    });

    // Overall score & stage (uses your existing lib)
    const overall = scoreOverall(PARTS, answers);

    // Derive per-part stage locally
    const stageByPartId: Record<string, number> = {
      [PID.dataCapture]: scoreToStage(scaled15ByPartId[PID.dataCapture] ?? 0),
      [PID.storInteg]: scoreToStage(scaled15ByPartId[PID.storInteg] ?? 0),
      [PID.analyReport]: scoreToStage(scaled15ByPartId[PID.analyReport] ?? 0),
      [PID.govAuto]: scoreToStage(scaled15ByPartId[PID.govAuto] ?? 0),
    };

    if (showDebug) {
      console.table(
        PARTS.map((p) => ({
          part: p.title,
          score0to15: (scaled15ByPartId[p.id] ?? 0).toFixed(2),
          stage: stageByPartId[p.id],
        }))
      );
      console.log("Overall 0..15 =", overall.overall0to15.toFixed(2), "| Stage =", overall.stage);
    }

    return {
      scaled15ByPartId,
      stageByPartId,
      overall, // { overall0to15, stage, ... }
    };
  }, [done, answers]);

  // POST to API after results exist (and only once per completion)
  useEffect(() => {
    if (!done || !results) return;

    const emailStored = localStorage.getItem("assessmentEmail") ?? "";
    if (!emailStored) return;

    const partScore = results.scaled15ByPartId;
    const partStage = results.stageByPartId;

    const body = {
      email: emailStored,
      overallScore: Number(results.overall.overall0to15.toFixed(2)),
      overallStage: results.overall.stage,

      dataCaptureScore: Number((partScore[PID.dataCapture] ?? 0).toFixed(2)),
      dataCaptureStage: partStage[PID.dataCapture] ?? 0,

      storIntegScore: Number((partScore[PID.storInteg] ?? 0).toFixed(2)),
      storIntegStage: partStage[PID.storInteg] ?? 0,

      analyReportScore: Number((partScore[PID.analyReport] ?? 0).toFixed(2)),
      analyReportStage: partStage[PID.analyReport] ?? 0,

      govAutoScore: Number((partScore[PID.govAuto] ?? 0).toFixed(2)),
      govAutoStage: partStage[PID.govAuto] ?? 0,
    };

    // Wrap in IIFE for async/await
    (async () => {
      try {
        const res = await fetch("/api/SubmitResult", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (showDebug) {
          console.log("SubmitResult -> status:", res.status, "json:", json);
        }
      } catch (e) {
        if (showDebug) console.error("SubmitResult error:", e);
      }
    })();
  }, [done, results]);

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
                tableRows: [], // keep debug out of PDF
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

