import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

type ResultPayload = {
  total: number;
  timestamp: string;
};

export async function handler(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = (await req.json()) as Partial<ResultPayload>;
    if (typeof body.total !== "number" || typeof body.timestamp !== "string") {
      return { status: 400, jsonBody: { ok: false, error: "Missing or invalid fields" } };
    }
    ctx.log("Received result", body);
    return { status: 200, jsonBody: { ok: true, received: body } };
  } catch (err) {
    ctx.log("Error parsing JSON:", err);
    return { status: 400, jsonBody: { ok: false, error: "Invalid JSON" } };
  }
}

app.http("SubmitResult", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler
});
