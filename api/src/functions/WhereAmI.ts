import { app } from "@azure/functions";

app.http("WhereAmI", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => {
    return {
      status: 200,
      jsonBody: {
        env: "local-or-prod",
        sqlServer: process.env.SQL_SERVER,
        sqlDb: process.env.SQL_DATABASE,
        hasConnStr: !!process.env.SQL_CONN,
      }
    };
  }
});


