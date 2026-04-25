"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EndpointHeader } from "@/components/EndpointHeader";
import { TryItForm } from "@/components/TryItForm";
import { ResponseTabs } from "@/components/ResponseTabs";
import { CompanyDetailCard } from "@/components/CompanyDetailCard";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ApiError, fetchCompany } from "@/lib/api";
import type { CompanyDetailResponse } from "@/lib/types";

export default function CompanyDetailPage() {
  const params = useParams<{ symbol: string }>();
  const router = useRouter();
  const urlSymbol = (params?.symbol ?? "").toString().toUpperCase();

  const [input, setInput] = useState(urlSymbol);
  const [data, setData] = useState<CompanyDetailResponse | null>(null);
  const [error, setError] = useState<{ status?: number; error: string; detail?: string | null } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInput(urlSymbol);
    if (!urlSymbol) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await fetchCompany(urlSymbol);
        if (!cancelled) setData(res);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError({
            status: err.status,
            error: err.body?.error ?? err.message,
            detail: err.body?.detail,
          });
        } else {
          setError({
            error: "Network error",
            detail: err instanceof Error ? err.message : String(err),
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [urlSymbol]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = input.trim().toUpperCase();
    if (!next) return;
    if (next === urlSymbol) return;
    router.push(`/companies/${encodeURIComponent(next)}`);
  }

  return (
    <div className="flex flex-col gap-8">
      <EndpointHeader
        method="GET"
        path="/companies/:symbol"
        description="Detailed info for one top-100 company: stats, categories, description, and yearly history."
      />

      <TryItForm onSubmit={onSubmit} loading={loading} submitLabel="Fetch">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="symbol">symbol</Label>
          <Input
            id="symbol"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="NVDA"
            className="w-40 font-mono uppercase"
            autoCapitalize="characters"
          />
          <p className="text-xs text-muted-foreground">
            Try NVDA, GOOG, AAPL, MSFT, AMZN, TSM…
          </p>
        </div>
      </TryItForm>

      {loading ? <DetailSkeleton /> : null}

      {error ? (
        <div className="flex flex-col gap-3">
          <ErrorBanner {...error} />
          {error.status === 404 ? (
            <p className="text-sm text-muted-foreground">
              Only top-100 companies are supported.{" "}
              <Link href="/companies" className="underline hover:text-foreground">
                Browse the list
              </Link>
              .
            </p>
          ) : null}
        </div>
      ) : null}

      {data ? (
        <ResponseTabs
          beautified={
            <CompanyDetailCard company={data.company} stale={data.stale} />
          }
          raw={data}
        />
      ) : null}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
