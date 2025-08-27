import { app, InvocationContext } from "@azure/functions";
import { getPool } from "../shared/db";

app.http("PingDb", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (_req, ctx: InvocationContext) => {
    try {
      const pool = await getPool();
      const r = await pool.request().query("SELECT COUNT(*) AS n FROM dbo.SelfAssessments;");
      return { status: 200, jsonBody: { ok: true, rows: r.recordset?.[0]?.n ?? 0 } };
    } catch (e: any) {
      ctx.error("PingDb error:", e);
      return { status: 500, jsonBody: { ok: false, error: String(e?.message ?? e) } };
    }
  },
});

