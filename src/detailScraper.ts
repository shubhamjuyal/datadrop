import { chromium } from "playwright";
import { config } from "./config.js";
import { companyDetails } from "./db.js";
import { parseMarketCap, parseNumber } from "./scraper.js";
import type { CompanyDetail, YearlyMarketCap } from "./types.js";

const BASE_URL = "https://companiesmarketcap.com";

interface RawDetail {
  name: string;
  symbol: string;
  logoUrl: string | null;
  rankRaw: string | null;
  marketCapRaw: string | null;
  priceRaw: string | null;
  change1dRaw: string | null;
  change1yRaw: string | null;
  country: string | null;
  categories: string[];
  description: string | null;
  history: Array<{ yearRaw: string; marketCapRaw: string; changeRaw: string }>;
}

function stripEmoji(s: string): string {
  return s
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\p{Regional_Indicator}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function scrapeCompanyDetail(params: {
  slug: string;
  symbol: string;
  name: string;
  logoUrl: string | null;
}): Promise<CompanyDetail> {
  const { slug, symbol, name, logoUrl: fallbackLogo } = params;
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript({ content: "globalThis.__name = (fn) => fn;" });
    const url = `${BASE_URL}/${slug}/marketcap/`;
    await page.goto(url, { timeout: config.scrapeTimeoutMs, waitUntil: "domcontentloaded" });
    await page.waitForLoadState("domcontentloaded");

    const raw: RawDetail = await page.evaluate(() => {
      const clean = (s: string | null | undefined) =>
        (s ?? "").replace(/\s+/g, " ").trim();

      const ownText = (el: Element): string => {
        const parts: string[] = [];
        for (const node of Array.from(el.childNodes)) {
          if (node.nodeType === 3) parts.push(node.textContent ?? "");
        }
        return clean(parts.join(" "));
      };

      const findValueByLabel = (label: string): string | null => {
        const all = Array.from(document.querySelectorAll("body *"));
        for (const el of all) {
          if (ownText(el) !== label) continue;
          let parent: Element | null = el.parentElement;
          for (let depth = 0; depth < 3 && parent; depth++, parent = parent.parentElement) {
            for (const sib of Array.from(parent.children)) {
              if (sib === el || sib.contains(el)) continue;
              const txt = clean(sib.textContent);
              if (!txt || txt === label) continue;
              if (txt.length > 80) continue;
              return txt;
            }
          }
        }
        return null;
      };

      const rankRaw = findValueByLabel("Rank");
      const marketCapRaw = findValueByLabel("Marketcap") || findValueByLabel("Market cap");
      const priceRaw = findValueByLabel("Share price");
      const change1dRaw = findValueByLabel("Change (1 day)");
      const change1yRaw = findValueByLabel("Change (1 year)");
      const country = findValueByLabel("Country");

      const categorySet = new Set<string>();
      const catLinks = Array.from(document.querySelectorAll("a[href*='/categories/']"));
      for (const a of catLinks) {
        const t = clean(a.textContent);
        if (t && t.length <= 40) categorySet.add(t);
      }

      let description: string | null = null;
      const paragraphs = Array.from(document.querySelectorAll("p, div"));
      for (const p of paragraphs) {
        const t = clean(p.textContent);
        if (t.length < 120) continue;
        if (p.querySelector("table, ul, ol")) continue;
        if (p.children.length > 5) continue;
        description = t;
        break;
      }

      const history: Array<{ yearRaw: string; marketCapRaw: string; changeRaw: string }> = [];
      const tables = Array.from(document.querySelectorAll("table"));
      for (const table of tables) {
        const headers = Array.from(table.querySelectorAll("thead th, thead td, tr:first-child th, tr:first-child td"))
          .map((th) => clean(th.textContent).toLowerCase());
        const hasYear = headers.some((h) => h === "year");
        const hasCap = headers.some((h) => h.startsWith("marketcap") || h.startsWith("market cap"));
        if (!hasYear || !hasCap) continue;

        const rows = Array.from(table.querySelectorAll("tbody tr"));
        for (const tr of rows) {
          const cells = Array.from(tr.querySelectorAll("td"));
          if (cells.length < 2) continue;
          history.push({
            yearRaw: clean(cells[0].textContent),
            marketCapRaw: clean(cells[1].textContent),
            changeRaw: cells.length >= 3 ? clean(cells[2].textContent) : "",
          });
        }
        if (history.length) break;
      }

      const firstImg = document.querySelector("img[src*='company-logos']") as HTMLImageElement | null;
      const logoUrl = firstImg?.src ?? null;

      const h1 = clean(document.querySelector("h1")?.textContent ?? "");
      const tickerCode = clean(document.querySelector(".company-code")?.textContent ?? "");

      return {
        name: h1,
        symbol: tickerCode,
        logoUrl,
        rankRaw,
        marketCapRaw,
        priceRaw,
        change1dRaw,
        change1yRaw,
        country,
        categories: Array.from(categorySet),
        description,
        history,
      };
    });

    const rankParsed = raw.rankRaw ? parseNumber(raw.rankRaw.replace(/#/g, "")) : null;
    const marketCapUsd = raw.marketCapRaw ? parseMarketCap(raw.marketCapRaw) : NaN;
    const history: YearlyMarketCap[] = raw.history
      .map((h) => ({
        year: Number.parseInt(h.yearRaw, 10),
        marketCapUsd: (() => {
          const n = parseMarketCap(h.marketCapRaw);
          return Number.isFinite(n) ? n : null;
        })(),
        changePct: parseNumber(h.changeRaw),
      }))
      .filter((h) => Number.isFinite(h.year));

    const doc: CompanyDetail = {
      symbol: symbol.toUpperCase(),
      slug,
      name: raw.name || name,
      rank: rankParsed,
      marketCapUsd: Number.isFinite(marketCapUsd) ? marketCapUsd : null,
      priceUsd: parseNumber(raw.priceRaw ?? ""),
      change1dPct: parseNumber(raw.change1dRaw ?? ""),
      change1yPct: parseNumber(raw.change1yRaw ?? ""),
      country: raw.country ? stripEmoji(raw.country) || null : null,
      logoUrl: raw.logoUrl ?? fallbackLogo,
      categories: raw.categories.map(stripEmoji).filter(Boolean),
      description: raw.description,
      history,
      detailScrapedAt: new Date(),
    };

    await companyDetails().updateOne(
      { symbol: doc.symbol },
      { $set: doc },
      { upsert: true },
    );

    console.log(`[detailScraper] upserted detail for ${doc.symbol} (${slug})`);
    return doc;
  } finally {
    await browser.close();
  }
}
