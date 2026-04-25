import { ReactNode } from "react";

interface InfoBlock {
  heading: string;
  body: ReactNode;
}

interface Props {
  blocks: InfoBlock[];
}

export function InfoSection({ blocks }: Props) {
  return (
    <section className="rounded-lg border border-border bg-muted/30 p-5">
      <div className="grid gap-5 md:grid-cols-3">
        {blocks.map((b) => (
          <div key={b.heading} className="flex flex-col gap-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {b.heading}
            </h3>
            <div className="text-sm text-foreground/90 leading-relaxed">
              {b.body}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
