"use client";

import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EndpointHeader } from "@/components/EndpointHeader";
import { InfoSection } from "@/components/InfoSection";
import { TryItForm } from "@/components/TryItForm";
import { ResponseTabs } from "@/components/ResponseTabs";
import { CompanyTable } from "@/components/CompanyTable";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ApiError, fetchCompanies } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import type { CompaniesResponse } from "@/lib/types";

export default function CompaniesPage() {
  const [limit, setLimit] = useState("10");
  const [data, setData] = useState<CompaniesResponse | null>(null);
  const [error, setError] = useState<{ status?: number; error: string; detail?: string | null } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const n = Number.parseInt(limit, 10);
      const res = await fetchCompanies(Number.isFinite(n) ? n : 10);
      setData(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ status: err.status, error: err.body?.error ?? err.message, detail: err.body?.detail });
      } else {
        setError({
          error: "Network error",
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <EndpointHeader
        method="GET"
        path="/companies"
        description="Top companies by market cap, ranked. Cached 24h; auto-rescrapes when stale."
      />

      <InfoSection
        blocks={[
          {
            heading: "What this page does",
            body: (
              <p>
                Calls <code className="rounded bg-muted px-1">GET /companies?limit=N</code> on
                the DataDrop API and renders the response — both as a parsed table and
                as raw JSON.
              </p>
            ),
          },
          {
            heading: "How it works under the hood",
            body: (
              <p>
                The backend scrapes the top 100 companies from{" "}
                <a
                  href="https://companiesmarketcap.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-foreground"
                >
                  companiesmarketcap.com
                </a>{" "}
                with headless Playwright, caches the result in MongoDB for 24 hours,
                and serves the first <code className="rounded bg-muted px-1">N</code>{" "}
                rows. Concurrent callers during a stale window share one in-flight
                scrape.
              </p>
            ),
          },
          {
            heading: "Try it",
            body: (
              <p>
                Pick a <code className="rounded bg-muted px-1">limit</code> (1–100),
                hit Send, and watch the freshness line — it shows{" "}
                <code className="rounded bg-muted px-1">lastScrapedAt</code> and a{" "}
                <code className="rounded bg-muted px-1">stale</code> flag if cached
                data is being served after a failed re-scrape. Click any row's symbol
                to drill into its detail page.
              </p>
            ),
          },
        ]}
      />

      <TryItForm onSubmit={onSubmit} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="limit">limit</Label>
          <Input
            id="limit"
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="10"
            className="w-32"
          />
          <p className="text-xs text-muted-foreground">1–100, default 10.</p>
        </div>
      </TryItForm>

      {loading ? <ResponseSkeleton /> : null}
      {error ? <ErrorBanner {...error} /> : null}

      {data ? (
        <ResponseTabs
          beautified={
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                {data.count} companies · last scraped{" "}
                {formatRelativeTime(data.lastScrapedAt)}
                {data.stale ? " · stale" : ""}
              </p>
              <CompanyTable companies={data.companies} />
            </div>
          }
          raw={data}
        />
      ) : null}
    </div>
  );
}

function ResponseSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
