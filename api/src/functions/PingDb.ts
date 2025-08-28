import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../shared/db";

app.http("PingDb", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (_req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const pool = await getPool();
      const { recordset } = await pool.request().query("SELECT 1 AS ok");
      return { status: 200, jsonBody: { ok: true, db: recordset?.[0]?.ok === 1 } };
    } catch (e: any) {
      ctx.error("[PingDb] error", e);
      return { status: 500, jsonBody: { ok: false, error: String(e?.message ?? e) } };
    }
  }
});


