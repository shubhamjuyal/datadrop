"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMarketCap, formatPct, formatPrice, pctClass } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Company } from "@/lib/types";

interface Props {
  companies: Company[];
}

export function CompanyTable({ companies }: Props) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-12 text-right">#</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead className="text-right">Market Cap</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">24h</TableHead>
            <TableHead>Country</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((c) => (
            <TableRow key={c.symbol}>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {c.rank}
              </TableCell>
              <TableCell>
                <Link
                  href={`/companies/${c.symbol}`}
                  className="flex items-center gap-3 hover:underline"
                >
                  {c.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.logoUrl}
                      alt=""
                      className="h-6 w-6 rounded object-cover bg-muted"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded bg-muted" />
                  )}
                  <span className="font-medium">{c.name}</span>
                </Link>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {c.symbol}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMarketCap(c.marketCapUsd)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPrice(c.priceUsd)}
              </TableCell>
              <TableCell
                className={cn("text-right tabular-nums", pctClass(c.change24hPct))}
              >
                {formatPct(c.change24hPct)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {c.country ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
