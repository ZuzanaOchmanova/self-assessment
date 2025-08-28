import * as sql from "mssql";

let poolPromise: Promise<sql.ConnectionPool> | undefined;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (poolPromise) return poolPromise;

  // Preferred if present
  const connStr = process.env.SQL_CONN;
  if (connStr) {
    poolPromise = new sql.ConnectionPool(connStr).connect();
    return poolPromise;
  }

  const server   = process.env.SQL_SERVER   || "av-crm.database.windows.net";
  const database = process.env.SQL_DATABASE || "db-av-crm";

  const hasMsi = !!process.env.IDENTITY_ENDPOINT || !!process.env.MSI_ENDPOINT;

  const authentication: sql.config["authentication"] = hasMsi
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

