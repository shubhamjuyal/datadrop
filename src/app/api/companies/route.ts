import { NextRequest, NextResponse } from "next/server";
import { companies, companyDetails, meta } from "@/lib/server/db";
import { ensureFresh, getFreshnessState } from "@/lib/server/cache";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

function parseLimit(raw: string | null): number | { error: string } {
  if (raw === null) return DEFAULT_LIMIT;
  if (!/^\d+$/.test(raw)) return { error: "limit must be between 1 and 100" };
  const n = Number.parseInt(raw, 10);
  if (n < 1 || n > MAX_LIMIT) return { error: "limit must be between 1 and 100" };
  return n;
}

export async function GET(request: NextRequest) {
  try {
    const parsed = parseLimit(request.nextUrl.searchParams.get("limit"));
    if (typeof parsed !== "number") {
      return NextResponse.json(parsed, { status: 400 });
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
      return NextResponse.json(
        {
          error: "Unable to fetch company data",
          detail: scrapeError?.message ?? "No cached data available",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      count: docs.length,
      lastScrapedAt,
      stale: scrapeError !== null,
      companies: docs,
    });
  } catch (err) {
    console.error("[api/companies] unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const companiesResult = await companies().deleteMany({});
    const metaResult = await meta().deleteMany({});
    const detailsResult = await companyDetails().deleteMany({});
    return NextResponse.json({
      deleted: {
        companies: companiesResult.deletedCount,
        meta: metaResult.deletedCount,
        companyDetails: detailsResult.deletedCount,
      },
    });
  } catch (err) {
    console.error("[api/companies] delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
