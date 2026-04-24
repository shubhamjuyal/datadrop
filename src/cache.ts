import { config } from "./config.js";
import { companyDetails, meta } from "./db.js";
import { scrapeTopCompanies } from "./scraper.js";
import { scrapeCompanyDetail } from "./detailScraper.js";
import type { CompanyDetail } from "./types.js";

export interface FreshnessState {
  lastScrapedAt: Date | null;
  stale: boolean;
}

export async function getFreshnessState(): Promise<FreshnessState> {
  const doc = await meta().findOne({ _id: "companies" });
  if (!doc) return { lastScrapedAt: null, stale: true };
  const stale = Date.now() - doc.lastScrapedAt.getTime() > config.cacheTtlMs;
  return { lastScrapedAt: doc.lastScrapedAt, stale };
}

let inflight: Promise<void> | null = null;

export async function ensureFresh(): Promise<void> {
  const { stale } = await getFreshnessState();
  if (!stale) return;
  if (inflight) return inflight;

  inflight = scrapeTopCompanies().finally(() => {
    inflight = null;
  });
  return inflight;
}

const detailInflight = new Map<string, Promise<CompanyDetail>>();

export async function ensureDetailFresh(params: {
  slug: string;
  symbol: string;
  name: string;
  logoUrl: string | null;
}): Promise<CompanyDetail> {
  const symbol = params.symbol.toUpperCase();
  const existing = await companyDetails().findOne({ symbol });
  if (existing && Date.now() - existing.detailScrapedAt.getTime() <= config.cacheTtlMs) {
    return existing;
  }

  const pending = detailInflight.get(symbol);
  if (pending) return pending;

  const p = scrapeCompanyDetail(params).finally(() => {
    detailInflight.delete(symbol);
  });
  detailInflight.set(symbol, p);
  return p;
}
