// index.js
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { Pool } = require("pg");

// ---- Caching: secrets + pool reused across invocations
let cachedSecret = null;
let pool = null;

async function getDbConfig() {
  if (cachedSecret) return cachedSecret;

  const sm = new SecretsManagerClient({});
  const { SecretString } = await sm.send(
    new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ID })
  );
  const cfg = JSON.parse(SecretString || "{}");
  cachedSecret = {
    host: cfg.host,
    port: Number(cfg.port || 5432),
    database: cfg.dbname || "greenpath_db",
    user: cfg.username,
    password: cfg.password,
    ssl: { require: true, rejectUnauthorized: false }, // <-- IMPORTANT
    max: 4,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  };
  return cachedSecret;
}

async function getPool() {
  if (pool) return pool;
  const conf = await getDbConfig();
  pool = new Pool(conf);
  return pool;
}

// ---- Helpers
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "Content-Type,Authorization",
};

const ok = (body, extraHeaders = {}) => ({
  statusCode: 200,
  headers: { "content-type": "application/json", ...CORS, ...extraHeaders },
  body: JSON.stringify(body),
});

const err = (status, message) => ({
  statusCode: status,
  headers: { "content-type": "application/json", ...CORS },
  body: JSON.stringify({ error: message }),
});

// ---- Route handlers
async function handleCountries() {
  const db = await getPool();
  // TODO: adjust table/columns to your schema
  const sql = `
    SELECT DISTINCT country_code AS code,
           COALESCE(country_name, country_code) AS name
    FROM emissions
    ORDER BY name;
  `;
  const { rows } = await db.query(sql);
  return ok(rows);
}

async function handleAgg(qs) {
  const country = String(qs?.country || "WORLD").toUpperCase();
  const from = Number(qs?.from ?? 2018);
  const to = Number(qs?.to ?? 2023);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) {
    return err(400, "Invalid year range");
  }

  const db = await getPool();
  // TODO: adjust table/column names to match your DB
  const sql = `
    SELECT year, SUM(value) AS value
    FROM emissions
    WHERE (country_code = $1 OR $1 = 'WORLD')
      AND year BETWEEN $2 AND $3
    GROUP BY year
    ORDER BY year;
  `;
  const { rows } = await db.query(sql, [country, from, to]);
  const data = rows.map(r => ({ year: Number(r.year), value: Number(r.value) || 0 }));
  return ok(data);
}

// ---- Lambda proxy handler (API Gateway HTTP or REST)
exports.handler = async (event) => {
  try {
    // Preflight support
    if (event.requestContext?.http?.method === "OPTIONS" || event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: CORS };
    }

    const method = (event.requestContext?.http?.method || event.httpMethod || "GET").toUpperCase();
    if (method !== "GET") return err(405, "Method Not Allowed");

    // HTTP API uses rawPath, REST uses path
    const raw = (event.rawPath || event.path || "/").replace(/\/+$/, "") || "/";
    const path = raw === "" ? "/" : raw;

    // Query params
    const qs = event.queryStringParameters || {};

    if (path === "/countries") return await handleCountries();
    if (path === "/agg")       return await handleAgg(qs);

    // Health check / discovery
    if (path === "/") return ok({ ok: true, routes: ["/countries", "/agg"] });

    return err(404, "Not Found");
  } catch (e) {
    console.error("Lambda error:", e);
    return err(500, String(e?.message || e));
  }
};

// ---- If you still want your original simple DB check (optional):
exports.getAgg = async () => {
  try {
    const db = await getPool();
    const { rows } = await db.query("SELECT 1 AS ok");
    return ok({ ok: rows?.[0]?.ok === 1 });
  } catch (e) {
    return err(500, `db error: ${String(e)}`);
  }
};
