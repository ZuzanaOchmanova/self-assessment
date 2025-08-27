import * as sql from "mssql";

let poolPromise: Promise<sql.ConnectionPool> | undefined;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (poolPromise) return poolPromise;

  const connStr = process.env.SQL_CONN;
  if (connStr) {
    poolPromise = new sql.ConnectionPool(connStr).connect();
    return poolPromise;
  }

  const server   = process.env.SQL_SERVER   || "av-crm.database.windows.net";
  const database = process.env.SQL_DATABASE || "db-av-crm";

  // Heuristics:
  const runningInAzure = !!process.env.WEBSITE_SITE_NAME; // SWA/Functions
  const hasMsiV2 = !!(process.env.IDENTITY_ENDPOINT || process.env.MSI_ENDPOINT);

  // mssql accepted types:
  //  - "azure-active-directory-default" (local via `az login`)
  //  - "azure-active-directory-msi-vm" (MSI v2 endpoints -> SWA/Functions, VM, Linux Consumption)
  //  - "azure-active-directory-msi-app-service" (classic App Service MSI)
  const authentication: any = hasMsiV2
    ? { type: "azure-active-directory-msi-vm" }
    : runningInAzure
    ? { type: "azure-active-directory-msi-app-service" }
    : { type: "azure-active-directory-default" };

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
