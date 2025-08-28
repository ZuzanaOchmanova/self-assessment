import { app } from "@azure/functions";

// Ensure every function file is imported so it can call app.http(...)
import "./functions/SubmitResult";
import "./functions/WhereAmI";
import "./functions/PingDb";
import "./functions/EgressIp";

