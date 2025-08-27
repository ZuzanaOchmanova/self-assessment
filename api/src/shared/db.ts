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

  // Heuristics for Azure vs local and MSI v2 endpoints
  const runningInAzure = !!process.env.WEBSITE_SITE_NAME;
  const hasMsiV2 = !!(process.env.IDENTITY_ENDPOINT || process.env.MSI_ENDPOINT);

  const chosenAuth =
    hasMsiV2 ? "azure-active-directory-msi-vm" :
    runningInAzure ? "azure-active-directory-msi-app-service" :
    "azure-active-directory-default";

  const config: sql.config = {
    server,
    database,
    options: { encrypt: true, trustServerCertificate: false },
    authentication: { type: chosenAuth } as any,
  };

  try {
    const pool = new sql.ConnectionPool(config);
    poolPromise = pool.connect();
    await poolPromise;
    return pool;
  } catch (err: any) {
    // add context so WhereAmI can show it
    err._ctx = { server, database, runningInAzure, hasMsiV2, chosenAuth };
    poolPromise = undefined;
    throw err;
  }
}

export { sql };
