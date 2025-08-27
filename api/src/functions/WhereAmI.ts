import { app, InvocationContext } from "@azure/functions";
import { getPool } from "../shared/db";

app.http("WhereAmI", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (_req, ctx: InvocationContext) => {
    try {
      const pool = await getPool();
      const rs = await pool.request().query(`
        SELECT
          DB_NAME()     AS db,
          @@SERVERNAME  AS serverName,
          SUSER_SNAME() AS suser,
          SYSTEM_USER   AS systemUser,
          (SELECT COUNT(*) FROM sys.objects WHERE name='SelfAssessments' AND type='U') AS hasTable,
          (SELECT COUNT(*) FROM sys.objects WHERE name='UpsertSelfAssessment' AND type='P') AS hasProc,
          (SELECT COUNT(*) FROM dbo.SelfAssessments) AS rowCount
      `);
      return { status: 200, jsonBody: { ok: true, ...rs.recordset?.[0] } };
    } catch (e: any) {
      ctx.error("WhereAmI error:", e);
      return { status: 500, jsonBody: { ok: false, error: String(e?.message ?? e) } };
    }
  },
});


