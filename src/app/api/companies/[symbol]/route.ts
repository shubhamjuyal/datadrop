import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { companies, companyDetails } from "@/lib/server/db";
import { ensureDetailFresh, ensureFresh } from "@/lib/server/cache";
import type { CompanyDetail } from "@/lib/types";

function deriveSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ symbol: string }> },
) {
  try {
    const { symbol: rawSymbol } = await ctx.params;
    if (typeof rawSymbol !== "string" || !/^[A-Za-z0-9.\-_]{1,16}$/.test(rawSymbol)) {
      return NextResponse.json({ error: "invalid symbol" }, { status: 400 });
    }
    const symbol = rawSymbol.toUpperCase();

    try {
      await ensureFresh();
    } catch (err) {
      console.error("[companies/:symbol] listing refresh failed:", (err as Error).message);
    }

    const listing = await (await companies()).findOne({ symbol });
    if (!listing) {
      return NextResponse.json(
        {
          error: "company not found",
          detail: `No listing entry for symbol ${symbol}. Only top-100 companies are supported.`,
        },
        { status: 404 },
      );
    }

    const slug = listing.slug ?? deriveSlug(listing.name);
    if (!slug) {
      return NextResponse.json(
        {
          error: "company not found",
          detail: `Could not resolve slug for symbol ${symbol}.`,
        },
        { status: 404 },
      );
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
      detail = await (await companyDetails()).findOne({ symbol });
    }

    if (!detail) {
      return NextResponse.json(
        {
          error: "Unable to fetch company detail",
          detail: detailError?.message ?? "No cached detail available",
        },
        { status: 503 },
      );
    }

    const { _id, ...rest } = detail as CompanyDetail & { _id?: unknown };
    return NextResponse.json({
      stale: detailError !== null,
      company: rest,
    });
  } catch (err) {
    console.error("[api/companies/symbol] unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
