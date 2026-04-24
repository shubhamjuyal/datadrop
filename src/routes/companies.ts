import { Router, type Request, type Response, type NextFunction } from "express";
import { companies, companyDetails, meta } from "../db.js";
import { ensureDetailFresh, ensureFresh, getFreshnessState } from "../cache.js";
import type { CompanyDetail } from "../types.js";

function deriveSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const companiesRouter = Router();

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

function parseLimit(raw: unknown): number | { error: string } {
  if (raw === undefined) return DEFAULT_LIMIT;
  if (typeof raw !== "string") return { error: "limit must be between 1 and 100" };
  if (!/^\d+$/.test(raw)) return { error: "limit must be between 1 and 100" };
  const n = Number.parseInt(raw, 10);
  if (n < 1 || n > MAX_LIMIT) return { error: "limit must be between 1 and 100" };
  return n;
}

companiesRouter.get("/companies", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = parseLimit(req.query.limit);
    if (typeof parsed !== "number") {
      res.status(400).json(parsed);
      return;
    }
    const limit = parsed;

    let scrapeError: Error | null = null;
    try {
      await ensureFresh();
    } catch (err) {
      scrapeError = err instanceof Error ? err : new Error(String(err));
      console.error("[companies] scrape failed:", scrapeError.message);
    }

    const { lastScrapedAt } = await getFreshnessState();

    const docs = await companies()
      .find({}, { projection: { _id: 0, scrapedAt: 0 } })
      .sort({ rank: 1 })
      .limit(limit)
      .toArray();

    if (docs.length === 0) {
      res.status(503).json({
        error: "Unable to fetch company data",
        detail: scrapeError?.message ?? "No cached data available",
      });
      return;
    }

    res.json({
      count: docs.length,
      lastScrapedAt,
      stale: scrapeError !== null,
      companies: docs,
    });
  } catch (err) {
    next(err);
  }
});

companiesRouter.get("/companies/:symbol", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawSymbol = req.params.symbol;
    if (typeof rawSymbol !== "string" || !/^[A-Za-z0-9.\-_]{1,16}$/.test(rawSymbol)) {
      res.status(400).json({ error: "invalid symbol" });
      return;
    }
    const symbol = rawSymbol.toUpperCase();

    try {
      await ensureFresh();
    } catch (err) {
      console.error("[companies/:symbol] listing refresh failed:", (err as Error).message);
    }

    const listing = await companies().findOne({ symbol });
    if (!listing) {
      res.status(404).json({
        error: "company not found",
        detail: `No listing entry for symbol ${symbol}. Only top-100 companies are supported.`,
      });
      return;
    }

    const slug = listing.slug ?? deriveSlug(listing.name);
    if (!slug) {
      res.status(404).json({
        error: "company not found",
        detail: `Could not resolve slug for symbol ${symbol}.`,
      });
      return;
    }

    let detailError: Error | null = null;
    let detail = null;
    try {
      detail = await ensureDetailFresh({
        slug,
        symbol,
        name: listing.name,
        logoUrl: listing.logoUrl,
      });
    } catch (err) {
      detailError = err instanceof Error ? err : new Error(String(err));
      console.error("[companies/:symbol] detail scrape failed:", detailError.message);
      detail = await companyDetails().findOne({ symbol });
    }

    if (!detail) {
      res.status(503).json({
        error: "Unable to fetch company detail",
        detail: detailError?.message ?? "No cached detail available",
      });
      return;
    }

    const { _id, ...rest } = detail as CompanyDetail & { _id?: unknown };
    res.json({
      stale: detailError !== null,
      company: rest,
    });
  } catch (err) {
    next(err);
  }
});

companiesRouter.delete("/companies", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const companiesResult = await companies().deleteMany({});
    const metaResult = await meta().deleteMany({});
    const detailsResult = await companyDetails().deleteMany({});
    res.json({
      deleted: {
        companies: companiesResult.deletedCount,
        meta: metaResult.deletedCount,
        companyDetails: detailsResult.deletedCount,
      },
    });
  } catch (err) {
    next(err);
  }
});
