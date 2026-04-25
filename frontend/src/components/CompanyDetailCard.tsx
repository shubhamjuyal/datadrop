import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatTile } from "@/components/StatTile";
import { HistoryTable } from "@/components/HistoryTable";
import {
  formatMarketCap,
  formatPct,
  formatPrice,
  formatRelativeTime,
  pctClass,
} from "@/lib/format";
import type { CompanyDetail } from "@/lib/types";

interface Props {
  company: CompanyDetail;
  stale: boolean;
}

export function CompanyDetailCard({ company, stale }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        {company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logoUrl}
            alt=""
            className="h-16 w-16 rounded-lg object-cover bg-muted"
          />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-muted" />
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold">{company.name}</h2>
            <span className="text-sm text-muted-foreground">
              {company.symbol}
            </span>
            {company.rank ? (
              <Badge variant="secondary">#{company.rank}</Badge>
            ) : null}
            {stale ? (
              <Badge variant="destructive">stale</Badge>
            ) : null}
          </div>
          {company.country ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {company.country}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            Detail scraped {formatRelativeTime(company.detailScrapedAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Market Cap"
          value={formatMarketCap(company.marketCapUsd)}
        />
        <StatTile
          label="Share Price"
          value={formatPrice(company.priceUsd)}
        />
        <StatTile
          label="Change (1 day)"
          value={formatPct(company.change1dPct)}
          className={pctClass(company.change1dPct)}
        />
        <StatTile
          label="Change (1 year)"
          value={formatPct(company.change1yPct)}
          className={pctClass(company.change1yPct)}
        />
      </div>

      {company.categories.length ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {company.categories.map((c) => (
              <Badge key={c} variant="outline">
                {c}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {company.description ? (
        <>
          <Separator />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              About
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              {company.description}
            </p>
          </div>
        </>
      ) : null}

      <Separator />
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          End of year market cap
        </p>
        <HistoryTable history={company.history} />
      </div>
    </div>
  );
}
