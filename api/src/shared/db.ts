import * as sql from "mssql";

let poolPromise: Promise<sql.ConnectionPool> | undefined;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (poolPromise) return poolPromise;

  // Optional: full connection string for local dev
  const connStr = process.env.SQL_CONN;
  if (connStr) {
    poolPromise = new sql.ConnectionPool(connStr).connect();
    return poolPromise;
  }

  const server   = process.env.SQL_SERVER   || "av-crm.database.windows.net";
  const database = process.env.SQL_DATABASE || "db-av-crm";

  // Detect a REAL Managed Identity (only when the token endpoint exists)
  const hasMsi =
    !!process.env.IDENTITY_ENDPOINT || !!process.env.MSI_ENDPOINT;

  // Use MSI only when we truly have it; otherwise use AAD Default (az login / VS Code, etc.)
  const authentication: sql.config["authentication"] = hasMsi
    ? { type: "azure-active-directory-msi-app-service" } // Works for App Service/Functions
    : { type: "azure-active-directory-default" };        // Local dev via az login

  const config: sql.config = {
    server,
    database,
    options: { encrypt: true, trustServerCertificate: false },
    authentication,
  };

  poolPromise = new sql.ConnectionPool(config).connect();
  return poolPromise;
}

export { sql };
