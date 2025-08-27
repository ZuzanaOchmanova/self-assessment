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

  submittedAt?: string; // optional; we use server time anyway
};

// Simple numeric guard to avoid NaN sneaking in
function isNum(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

app.http("SubmitResult", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const payload = (await req.json()) as AssessmentPayload;
      ctx.log("Payload received:", payload);

      const email = payload?.email?.trim();
      if (!email) {
        return { status: 400, jsonBody: { ok: false, error: "Missing 'email' in payload." } };
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
          return { status: 400, jsonBody: { ok: false, error: `Missing/invalid '${k}'` } };
        }
      }

      // Server time
      const submittedAt = new Date();

      const pool = await getPool();
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
      ctx.log("Upsert rowsAffected:", r?.rowsAffected, "returnValue:", r?.returnValue);

      return { status: 201, jsonBody: { ok: true } };
    } catch (err: any) {
      ctx.error("DB error:", err);
      return { status: 500, jsonBody: { ok: false, error: String(err?.message ?? err) } };
    }
  },
});

