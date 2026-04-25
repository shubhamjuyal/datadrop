import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  className?: string;
}

export function StatTile({ label, value, className }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-xl font-semibold tabular-nums", className)}>
        {value}
      </div>
    </div>
  );
}
