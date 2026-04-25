"use client";

import { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  children: ReactNode;
  submitLabel?: string;
}

export function TryItForm({ onSubmit, loading, children, submitLabel = "Send" }: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-border bg-card p-4 flex flex-col gap-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Try it out
      </p>
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        {children}
        <Button type="submit" disabled={loading} className="md:ml-auto">
          {loading ? "Loading…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
