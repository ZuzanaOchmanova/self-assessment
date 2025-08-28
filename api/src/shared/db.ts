import * as sql from "mssql";
import { DefaultAzureCredential } from "@azure/identity";

let poolPromise: Promise<sql.ConnectionPool> | undefined;

async function connectWithAccessToken(server: string, database: string) {
  // Get an AAD token for Azure SQL
  const credential = new DefaultAzureCredential();
  const token = await credential.getToken("https://database.windows.net/.default");
  if (!token?.token) {
    throw new Error("Failed to acquire AAD access token for SQL.");
  }

  const config: sql.config = {
    server,
    database,
    options: { encrypt: true, trustServerCertificate: false },
    // Pass the token directly to tedious via mssql
    authentication: {
      type: "azure-active-directory-access-token",
      options: { token: token.token },
    },
  };

  const pool = new sql.ConnectionPool(config);
  return pool.connect();
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (poolPromise) return poolPromise;

  // 1) Local override: full connection string if provided (dev only)
  const connStr = process.env.SQL_CONN;
  if (connStr) {
    poolPromise = new sql.ConnectionPool(connStr).connect();
    return poolPromise;
  }

  // 2) Default to AAD token flow (works for local az login & SWA Managed Identity)
  const server   = process.env.SQL_SERVER   || "av-crm.database.windows.net";
  const database = process.env.SQL_DATABASE || "db-av-crm";

  poolPromise = connectWithAccessToken(server, database);
  return poolPromise;
}

export { sql };


