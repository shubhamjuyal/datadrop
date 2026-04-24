import { chromium } from "playwright";
import { config } from "./config.js";
import { companies, meta } from "./db.js";
import type { Company } from "./types.js";

const SOURCE_URL = "https://companiesmarketcap.com/";
const PAGE_SIZE = 100;

interface ScrapedRow {
  name: string;
  symbol: string;
  slug: string | null;
  marketCapRaw: string;
  priceRaw: string;
  change24hRaw: string;
  country: string | null;
  logoUrl: string | null;
}

export function parseMarketCap(s: string): number {
  const cleaned = s.replace(/[$,\s]/g, "");
  const m = cleaned.match(/^([\d.]+)([TBMK])?$/i);
  if (!m) return NaN;
  const n = Number.parseFloat(m[1]);
  const suffix = m[2]?.toUpperCase();
  const mult = suffix === "T" ? 1e12 : suffix === "B" ? 1e9 : suffix === "M" ? 1e6 : suffix === "K" ? 1e3 : 1;
  return n * mult;
}

export function parseNumber(s: string): number | null {
  const cleaned = s.replace(/[$,%\s]/g, "");
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

export async function scrapeTopCompanies(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript({ content: "globalThis.__name = (fn) => fn;" });
    await page.goto(SOURCE_URL, { timeout: config.scrapeTimeoutMs, waitUntil: "domcontentloaded" });
    await page.waitForSelector("table.default-table tbody tr", { timeout: config.scrapeTimeoutMs });

    const rows: ScrapedRow[] = await page.evaluate((pageSize) => {
      const out: ScrapedRow[] = [];
      const trs = document.querySelectorAll("table.default-table tbody tr");
      for (let i = 0; i < trs.length && out.length < pageSize; i++) {
        const tr = trs[i] as HTMLElement;
        const cells = tr.querySelectorAll("td");
        if (cells.length < 4) continue;

        const name = tr.querySelector(".company-name")?.textContent?.trim() ?? "";
        const symbol = tr.querySelector(".company-code")?.textContent?.trim() ?? "";
        if (!name || !symbol) continue;

        const logoImg = tr.querySelector("td.name-td img") as HTMLImageElement | null;
        const logoUrl = logoImg?.src ?? null;

        const nameAnchor = tr.querySelector(".company-name")?.closest("a") as HTMLAnchorElement | null;
        const logoAnchor = logoImg?.closest("a") as HTMLAnchorElement | null;
        let slug: string | null = null;
        for (const a of [nameAnchor, logoAnchor, ...Array.from(tr.querySelectorAll("a"))]) {
          if (!a) continue;
          const raw = (a as HTMLAnchorElement).getAttribute("href") ?? "";
          const path = raw.replace(/^https?:\/\/[^/]+/i, "");
          const m = path.match(/^\/([a-z0-9][a-z0-9-]*)(?:\/|$)/i);
          if (!m) continue;
          const candidate = m[1].toLowerCase();
          if (["categories", "etfs", "ranking", "global-ranking", "app", "api", "about", "contact", "img", "markets", "marketcap"].includes(candidate)) continue;
          slug = candidate;
          break;
        }

        const imgs = Array.from(tr.querySelectorAll("img")) as HTMLImageElement[];
        const countryImg = imgs.find((img) => {
          const alt = img.getAttribute("alt") ?? "";
          if (!alt) return false;
          if (/favorite|icon|star/i.test(alt)) return false;
          if (img.src === logoImg?.src) return false;
          return true;
        });
        const lastCell = cells[cells.length - 1];
        const lastCellText = (lastCell?.textContent ?? "")
          .replace(/\p{Extended_Pictographic}/gu, "")
          .replace(/\p{Regional_Indicator}/gu, "")
          .replace(/\s+/g, " ")
          .trim();
        const country =
          tr.querySelector(".country-name")?.textContent?.trim() ||
          countryImg?.getAttribute("alt") ||
          lastCellText ||
          null;

        const cellText = (idx: number) => (cells[idx]?.textContent ?? "").replace(/\s+/g, " ").trim();

        let marketCapRaw = "";
        let priceRaw = "";
        let change24hRaw = "";
        for (let c = 2; c < cells.length; c++) {
          const t = cellText(c);
          if (!marketCapRaw && /[\d.]+\s*[TBMK]\b/i.test(t)) {
            marketCapRaw = t;
            priceRaw = cellText(c + 1);
            change24hRaw = cellText(c + 2);
            break;
          }
        }

        out.push({ name, symbol, slug, marketCapRaw, priceRaw, change24hRaw, country, logoUrl });
      }
      return out;
    }, PAGE_SIZE);

    if (rows.length === 0) throw new Error("Scraper found zero rows — selectors may be broken");

    const now = new Date();
    const docs: Company[] = rows.map((r, i) => ({
      symbol: r.symbol.toUpperCase(),
      slug: r.slug,
      name: r.name,
      rank: i + 1,
      marketCapUsd: parseMarketCap(r.marketCapRaw),
      priceUsd: parseNumber(r.priceRaw),
      change24hPct: parseNumber(r.change24hRaw),
      country: r.country,
      logoUrl: r.logoUrl,
      scrapedAt: now,
    }));

    await companies().bulkWrite(
      docs.map((d) => ({
        updateOne: {
          filter: { symbol: d.symbol },
          update: { $set: d },
          upsert: true,
        },
      })),
    );

    await meta().updateOne(
      { _id: "companies" },
      { $set: { lastScrapedAt: now } },
      { upsert: true },
    );

    console.log(`[scraper] upserted ${docs.length} companies at ${now.toISOString()}`);
  } finally {
    await browser.close();
  }
}
