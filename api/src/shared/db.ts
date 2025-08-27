import * as sql from "mssql";

let poolPromise: Promise<sql.ConnectionPool> | undefined;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (poolPromise) return poolPromise;

  // If a full connection string is provided (local override), use it.
  const connStr = process.env.SQL_CONN;
  if (connStr) {
    poolPromise = new sql.ConnectionPool(connStr).connect();
    return poolPromise;
  }

  const server   = process.env.SQL_SERVER   || "av-crm.database.windows.net";
  const database = process.env.SQL_DATABASE || "db-av-crm";

  // Prefer a direct MSI signal, then fall back to common Azure envs
  const hasMsi = !!(process.env.IDENTITY_ENDPOINT || process.env.MSI_ENDPOINT);
  const runningInAzure = hasMsi || !!process.env.WEBSITE_SITE_NAME || !!process.env.FUNCTIONS_WORKER_RUNTIME;

  const authentication: any = runningInAzure
    ? { type: "azure-active-directory-msi-app-service" } // Managed Identity in Azure Functions/SWA
    : { type: "azure-active-directory-default" };        // Local (uses your az login)

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

