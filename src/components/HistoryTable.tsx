import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMarketCap, formatPct, pctClass } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { YearlyMarketCap } from "@/lib/types";

interface Props {
  history: YearlyMarketCap[];
}

export function HistoryTable({ history }: Props) {
  if (!history?.length) {
    return (
      <p className="text-sm text-muted-foreground">No history data available.</p>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Year</TableHead>
            <TableHead className="text-right">Market Cap</TableHead>
            <TableHead className="text-right">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((row) => (
            <TableRow key={row.year}>
              <TableCell className="font-medium tabular-nums">{row.year}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMarketCap(row.marketCapUsd)}
              </TableCell>
              <TableCell
                className={cn("text-right tabular-nums", pctClass(row.changePct))}
              >
                {formatPct(row.changePct)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
