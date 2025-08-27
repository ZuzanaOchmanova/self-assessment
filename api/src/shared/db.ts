import * as sql from "mssql";

let poolPromise: Promise<sql.ConnectionPool> | undefined;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (poolPromise) return poolPromise;

  // If you provided a full connection string for local dev, use it.
  const connStr = process.env.SQL_CONN;
  if (connStr) {
    poolPromise = new sql.ConnectionPool(connStr).connect();
    return poolPromise;
  }

  const server   = process.env.SQL_SERVER   || "av-crm.database.windows.net";
  const database = process.env.SQL_DATABASE || "db-av-crm";

  // In Azure Functions (SWA managed functions/App Service), WEBSITE_SITE_NAME is present.
  const runningInAzure = !!process.env.WEBSITE_SITE_NAME;

  // ✅ VALID values for mssql auth types:
  // - local dev via az login: "azure-active-directory-default"
  // - Azure managed identity (App Service): "azure-active-directory-msi-app-service"
  const authentication: any = runningInAzure
    ? { type: "azure-active-directory-msi-app-service" } // MSI in Azure
    : { type: "azure-active-directory-default" };        // your local az login

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
