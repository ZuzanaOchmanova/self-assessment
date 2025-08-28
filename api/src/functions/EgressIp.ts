import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

app.http("EgressIp", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (_req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const r = await fetch("https://api.ipify.org");  // returns plain text IPv4
      const ip = await r.text();
      ctx.log("Outbound IP:", ip);
      return { status: 200, jsonBody: { ip } };
    } catch (e: any) {
      ctx.error(e);
      return { status: 500, jsonBody: { error: String(e?.message ?? e) } };
    }
  },
});
