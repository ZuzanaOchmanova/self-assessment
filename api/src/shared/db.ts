// api/src/shared/db.ts
import * as sql from "mssql";
import {
  ManagedIdentityCredential,
  DefaultAzureCredential,
  ChainedTokenCredential,
} from "@azure/identity";

let poolPromise: Promise<sql.ConnectionPool> | undefined;

function buildCredential() {
  // Prod: Managed Identity (SWA Standard exposes MI)
  const mi = new ManagedIdentityCredential();
  // Local/dev: az login, VS Code, etc.
  const local = new DefaultAzureCredential();
  return new ChainedTokenCredential(mi, local);
}

async function connectAAD(server: string, database: string) {
  const credential = buildCredential();
  const token = await credential.getToken("https://database.windows.net/.default");
  if (!token?.token) throw new Error("Failed to get AAD token for SQL.");

  const cfg: sql.config = {
    server,
    database,
    options: { encrypt: true, trustServerCertificate: false },
    authentication: {
      type: "azure-active-directory-access-token",
      options: { token: token.token },
    },
  };
  return new sql.ConnectionPool(cfg).connect();
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (poolPromise) return poolPromise;

  // Dev override if you ever need it locally
  if (process.env.SQL_CONN) {
    poolPromise = new sql.ConnectionPool(process.env.SQL_CONN).connect();
    return poolPromise;
  }

  const server   = process.env.SQL_SERVER   || "av-crm.database.windows.net";
  const database = process.env.SQL_DATABASE || "db-av-crm";
  poolPromise = connectAAD(server, database);
  return poolPromise;
}

export { sql };


