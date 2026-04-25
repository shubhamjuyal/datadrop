import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function intOr(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) throw new Error(`Env var ${name} must be an integer, got "${v}"`);
  return n;
}

// CORS: unset or * = any origin; comma = allowlist
function corsOriginFromEnv(): boolean | string | string[] {
  const raw = process.env.CORS_ORIGIN;
  if (raw === undefined) {
    return true; // public by default
  }
  const t = raw.trim();
  if (t === "" || t === "*") {
    return true; // reflect request Origin — public read API
  }
  const parts = t.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) {
    return true;
  }
  return parts.length === 1 ? parts[0]! : parts;
}

export const config = Object.freeze({
  mongoUri: required("MONGODB_URI"),
  port: intOr("PORT", 3000),
  cacheTtlMs: intOr("CACHE_TTL_HOURS", 24) * 60 * 60 * 1000,
  scrapeTimeoutMs: intOr("SCRAPE_TIMEOUT_MS", 30_000),
  corsOrigin: corsOriginFromEnv(),
});
