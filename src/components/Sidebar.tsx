"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  href: string;
  label: string;
  method: "GET";
  pathLabel: string;
  matchPrefix?: string;
}

const NAV: NavItem[] = [
  { href: "/companies", label: "List companies", method: "GET", pathLabel: "/companies" },
  {
    href: "/companies/NVDA",
    label: "Get company by symbol",
    method: "GET",
    pathLabel: "/companies/:symbol",
    matchPrefix: "/companies/",
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.matchPrefix) return pathname.startsWith(item.matchPrefix) && pathname !== "/companies";
  return pathname === item.href;
}

export function Sidebar() {
  const pathname = usePathname() ?? "/";
  return (
    <aside className="hidden md:flex md:w-72 md:flex-col border-r border-border bg-muted/30 px-4 py-6">
      <div className="mb-6">
        <Link href="/" className="block">
          <h1 className="text-xl font-bold tracking-tight">DataDrop</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live market cap data
          </p>
        </Link>
      </div>

      <nav className="flex flex-col gap-1">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Endpoints
        </p>
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex flex-col gap-1 rounded-md px-2 py-2 transition-colors hover:bg-muted",
                active && "bg-muted",
              )}
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    active && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                  )}
                >
                  {item.method}
                </Badge>
                <span
                  className={cn(
                    "text-xs",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.pathLabel}
                </span>
              </div>
              <span
                className={cn(
                  "text-xs",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 text-xs text-muted-foreground">
        <p>Source:{" "}
          <a
            href="https://companiesmarketcap.com"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            companiesmarketcap.com
          </a>
        </p>
      </div>
    </aside>
  );
}
