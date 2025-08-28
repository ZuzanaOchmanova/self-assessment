import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, sql } from "../shared/db";

type AssessmentPayload = {
  email: string;

  overallScore: number;
  overallStage: number;

  dataCaptureScore: number;
  dataCaptureStage: number;

  storIntegScore: number;
  storIntegStage: number;

  analyReportScore: number;
  analyReportStage: number;

  govAutoScore: number;
  govAutoStage: number;

  submittedAt?: string; // optional; server time used anyway
};

// Simple numeric guard to avoid NaN sneaking in
function isNum(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

app.http("SubmitResult", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const requestId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    try {
      const payload = (await req.json()) as AssessmentPayload;
      ctx.log("[SubmitResult] requestId:", requestId, "payload:", payload);

      const email = payload?.email?.trim();
      if (!email) {
        ctx.warn("[SubmitResult]", requestId, "Missing email");
        return { status: 400, jsonBody: { ok: false, error: "Missing 'email' in payload.", requestId } };
      }

      // Validate numeric fields exist
      const requiredNums: Array<[keyof AssessmentPayload, number | undefined]> = [
        ["overallScore", payload.overallScore],
        ["overallStage", payload.overallStage],
        ["dataCaptureScore", payload.dataCaptureScore],
        ["dataCaptureStage", payload.dataCaptureStage],
        ["storIntegScore", payload.storIntegScore],
        ["storIntegStage", payload.storIntegStage],
        ["analyReportScore", payload.analyReportScore],
        ["analyReportStage", payload.analyReportStage],
        ["govAutoScore", payload.govAutoScore],
        ["govAutoStage", payload.govAutoStage],
      ];
      for (const [k, v] of requiredNums) {
        if (!isNum(v)) {
          ctx.warn("[SubmitResult]", requestId, "Invalid numeric field:", k, "value:", v);
          return { status: 400, jsonBody: { ok: false, error: `Missing/invalid '${k}'`, requestId } };
        }
      }

      // Server time
      const submittedAt = new Date();

      // Log inputs in one place (easier to copy-run in SSMS later)
      ctx.log("[SubmitResult] executing UpsertSelfAssessment", {
        requestId,
        Email: email,
        SubmittedAt: submittedAt.toISOString(),
        OverallScore: payload.overallScore,
        OverallStage: payload.overallStage,
        DataCaptureScore: payload.dataCaptureScore,
        DataCaptureStage: payload.dataCaptureStage,
        StorIntegScore: payload.storIntegScore,
        StorIntegStage: payload.storIntegStage,
        AnalyReportScore: payload.analyReportScore,
        AnalyReportStage: payload.analyReportStage,
        GovAutoScore: payload.govAutoScore,
        GovAutoStage: payload.govAutoStage
      });

      const pool = await getPool();
      ctx.log("[SubmitResult]", requestId, "DB connected");

      const request = pool
        .request()
        .input("Email",            sql.NVarChar(256), email)
        .input("SubmittedAt",      sql.DateTime2,     submittedAt)

        .input("OverallScore",     sql.Decimal(5, 2), payload.overallScore)
        .input("OverallStage",     sql.TinyInt,       payload.overallStage)

        .input("DataCaptureScore", sql.Decimal(5, 2), payload.dataCaptureScore)
        .input("DataCaptureStage", sql.TinyInt,       payload.dataCaptureStage)

        .input("StorIntegScore",   sql.Decimal(5, 2), payload.storIntegScore)
        .input("StorIntegStage",   sql.TinyInt,       payload.storIntegStage)

        .input("AnalyReportScore", sql.Decimal(5, 2), payload.analyReportScore)
        .input("AnalyReportStage", sql.TinyInt,       payload.analyReportStage)

        .input("GovAutoScore",     sql.Decimal(5, 2), payload.govAutoScore)
        .input("GovAutoStage",     sql.TinyInt,       payload.govAutoStage);

      const r = await request.execute("dbo.UpsertSelfAssessment");

      // mssql returns rowsAffected as an array (per statement)
      const affected = Array.isArray(r?.rowsAffected)
        ? r.rowsAffected.reduce((a, b) => a + b, 0)
        : (typeof r?.rowsAffected === "number" ? r.rowsAffected : 0);

      ctx.log("[SubmitResult]", requestId, "proc result:", {
        rowsAffected: r?.rowsAffected,
        affectedTotal: affected,
        returnValue: r?.returnValue,
        output: r?.output
      });

      // Optional: surface affectedTotal to caller to make it obvious if nothing changed
      return { status: 201, jsonBody: { ok: true, affected: affected, requestId } };
    } catch (err: any) {
      ctx.error("[SubmitResult]", requestId, "DB error:", err);
      return { status: 500, jsonBody: { ok: false, error: String(err?.message ?? err), requestId } };
    }
  },
});
