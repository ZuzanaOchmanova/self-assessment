import * as sql from "mssql";
import {
  ClientSecretCredential,
  ManagedIdentityCredential,
  DefaultAzureCredential,
  ChainedTokenCredential,
} from "@azure/identity";

let poolPromise: Promise<sql.ConnectionPool> | undefined;

function buildCredential() {
  // Works on SWA: prefer explicit client secret when provided
  if (process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET) {
    return new ClientSecretCredential(
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      process.env.AZURE_CLIENT_SECRET!
    );
  }
  // Try MI (works for BYO Functions; harmless otherwise)
  const mi = new ManagedIdentityCredential();
  // Local dev fallback (az login / VSCode)
  const local = new DefaultAzureCredential();
  return new ChainedTokenCredential(mi, local);
}

async function connectAAD(server: string, database: string) {
  const credential = buildCredential();
  const token = await credential.getToken("https://database.windows.net/.default");
  if (!token?.token) throw new Error("Failed to acquire AAD token for SQL.");

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


