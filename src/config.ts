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

export const config = Object.freeze({
  mongoUri: required("MONGODB_URI"),
  port: intOr("PORT", 3000),
  cacheTtlMs: intOr("CACHE_TTL_HOURS", 24) * 60 * 60 * 1000,
  scrapeTimeoutMs: intOr("SCRAPE_TIMEOUT_MS", 30_000),
});
