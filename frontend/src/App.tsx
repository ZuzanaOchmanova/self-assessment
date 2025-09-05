import { useMemo, useState, useEffect } from "react";
import QuestionCard from "./components/QuestionCard";
import { createResultsPdf } from "./lib/pdf";
import { PART_STAGE_COPY } from "./content/partStageText";

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

const STAGE_IMAGES: Record<number, string> = {
  0: "/stage0.png",
  1: "/stage1.png",
  2: "/stage2.png",
  3: "/stage3.png",
  4: "/stage4.png",
  5: "/stage5.png",
  6: "/stage6.png",
};

// Known PartIds (for convenience)
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

// Map 0..15 score → stage 0..6
function scoreToStage(score0to15: number): number {
  const bucket = 15 / 6; // ≈2.5 each
  const n = Math.round(score0to15 / bucket);
  return Math.max(0, Math.min(6, n));
}
const clampStage = (n: number) =>
  (Math.max(0, Math.min(6, Math.round(n))) as 0 | 1 | 2 | 3 | 4 | 5 | 6);

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
  const pct = useMemo(
    () => (total ? Math.round((index / total) * 100) : 0),
    [index, total]
  );

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

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
    } else {
      setAnswers(nextAnswers);
      setIndex(nextIndex);
    }
  };

  // Compute results once finished
  const results = useMemo(() => {
    if (!done) return null;

    // Raw per-part score
    const rawByPartId = PARTS.reduce((acc, p) => {
      const { raw } = scorePart(p, answers);
      acc[p.id] = raw;
      return acc;
    }, {} as Record<PartId, number>);

    // Max per-part score
    const maxByPartId = PARTS.reduce((acc, p) => {
      const max = p.questions.reduce((m, q) => m + 3 * q.weight, 0);
      acc[p.id] = max;
      return acc;
    }, {} as Record<PartId, number>);

    // Scale to 0..15
    const scaled15ByPartId: Record<string, number> = {};
    PARTS.forEach((p) => {
      const max = maxByPartId[p.id] || 0;
      const raw = rawByPartId[p.id] || 0;
      const scaled15 = max > 0 ? (raw / max) * 15 : 0;
      scaled15ByPartId[p.id] = scaled15;
    });

    // Overall score & stage
    const overall = scoreOverall(PARTS, answers);

    // Per-part stage
    const stageByPartId: Record<string, number> = {};
    PARTS.forEach((p) => {
      const s15 = scaled15ByPartId[p.id] ?? 0;
      stageByPartId[p.id] = scoreToStage(s15);
    });

    if (showDebug) {
      console.table(
        PARTS.map((p) => ({
          part: p.title,
          score0to15: (scaled15ByPartId[p.id] ?? 0).toFixed(2),
          stage: stageByPartId[p.id],
        }))
      );
      console.log(
        "Overall 0..15 =",
        overall.overall0to15.toFixed(2),
        "| Stage =",
        overall.stage
      );
    }

    return {
      scaled15ByPartId,
      stageByPartId,
      overall,
    };
  }, [done, answers]);

  // POST results to API
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

  // Build the PDF payload (ALWAYS use partStageText copy; robust to id drift)
  const handleDownloadPdf = () => {
  if (!results) return;

  // helper: normalize part.id/title -> the PartKey used in PART_STAGE_COPY
  const resolvePartKey = (
    partId: string,
    title: string
  ): keyof typeof PART_STAGE_COPY => {
    // exact ids first (preferred)
    switch (partId) {
      case "dataCapture":
        return "dataCapture";
      case "storInteg":
        return "storInteg";
      case "analyReport":
        return "analyReport";
      case "govAuto":
        return "govAuto";
    }
    // tolerant title-based mapping as a safety net
    const t = title.toLowerCase();
    if (t.includes("analytics")) return "analyReport";
    if (t.includes("storage") || t.includes("integration")) return "storInteg";
    if (t.includes("govern") || t.includes("automation")) return "govAuto";
    if (t.includes("capture")) return "dataCapture";

    // hard fail so we don't silently use overall text
    throw new Error(`No PART_STAGE_COPY mapping for partId="${partId}" (title="${title}")`);
  };

  try {
    const overallStage = results.overall.stage;

    const partsPayload = PARTS.map((part) => {
      const key = resolvePartKey(part.id, part.title);

      const partScore = results.scaled15ByPartId[part.id] ?? 0;
      const partStageNum = results.stageByPartId[part.id] ?? 0;

      // cast the number to the literal 0|1|2|3|4|5|6 so TS indexes safely
      const stageLiteral = (partStageNum as unknown) as 0 | 1 | 2 | 3 | 4 | 5 | 6;

      const copy = PART_STAGE_COPY[key][stageLiteral];
      if (!copy) {
        throw new Error(
          `Missing PART_STAGE_COPY for key="${key}" stage=${partStageNum}`
        );
      }

      return {
        label: part.title,
        score0to15: Number(partScore.toFixed(2)),
        stage: partStageNum,
        stageName: STAGE_NAMES[partStageNum] ?? "Unknown",
        stageImagePath: STAGE_IMAGES[partStageNum],
        overview: copy.overview,
        quick: copy.quick,
        longterm: copy.longterm,
      };
    });

    createResultsPdf({
      stage: overallStage,
      stageName: STAGE_NAMES[overallStage] ?? "Unknown stage",
      score: results.overall.overall0to15,
      recommendation: OVERALL_RECS_BY_STAGE[overallStage],
      quick: QUICK_IMPROVEMENTS_BY_STAGE[overallStage],
      longterm: LONG_TERM_GOALS_BY_STAGE[overallStage],
      overallStageImagePath: STAGE_IMAGES[overallStage],
      parts: partsPayload,
    });
  } catch (e) {
    console.error("[PDF] payload build error:", e);
    alert(
      "We couldn't build the PDF sections because a part key didn't match your PartStageText. Open the console for details."
    );
  }
};

  // ------------------ Intro screen ------------------
  if (isIntro) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          padding: "10px 4px",
        }}
      >
        <div style={{ maxWidth: 760, width: "100%", textAlign: "center" }}>
          <img
            src="/bcback.png"
            alt="AdoptVerve logo"
            style={{
              width: "100%",
              maxWidth: "500px",
              height: "auto",
              display: "block",
              margin: "0 auto 24px",
              borderRadius: "12px",
            }}
          />

          <h1
            style={{
              color: "#592C89",
              fontSize: 36,
              fontWeight: 800,
              margin: 0,
            }}
          >
            Data Maturity Self-Assessment
          </h1>

          <p style={{ marginTop: 12, lineHeight: 1.6 }}>
            Becoming a data-mature organization isn’t just about technology —
            it’s a journey that touches every corner of your business. This quick
            self-assessment will help you uncover your team’s or organization’s
            level of data maturity.
          </p>

          <div style={{ marginTop: 8, opacity: 0.9 }}>
            <span>20 questions</span> · <span>10 minutes</span>
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
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
              <div style={{ marginTop: 6, fontSize: 12, color: "#B00020" }}>
                {emailErr}
              </div>
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
      </div>
    );
  }

  // ------------------ Finished view ------------------
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
      <div style={{ maxWidth: 680, margin: "48px auto", padding: "4px 12px" }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#592C89" }}>
          {`Stage ${stage}: ${stageName}`}
        </div>

        <p style={{ marginTop: 12, color: "#0A0A0A" }}>
          Overall score:{" "}
          <strong>{results.overall.overall0to15.toFixed(2)}</strong>
        </p>

        {STAGE_IMAGES[stage] && (
          <div style={{ textAlign: "center", margin: "10px 0 6px" }}>
            <img
              src={STAGE_IMAGES[stage]}
              alt={`Stage ${stage} illustration`}
              style={{ maxWidth: "100%", height: "auto", borderRadius: "12px" }}
            />
          </div>
        )}

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

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={handleDownloadPdf}
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
            Download Full Report
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

  // ------------------ Question view ------------------
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
