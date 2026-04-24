export interface Company {
  symbol: string;
  slug: string | null;
  name: string;
  rank: number;
  marketCapUsd: number;
  priceUsd: number | null;
  change24hPct: number | null;
  country: string | null;
  logoUrl: string | null;
  scrapedAt: Date;
}

export interface YearlyMarketCap {
  year: number;
  marketCapUsd: number | null;
  changePct: number | null;
}

export interface CompanyDetail {
  symbol: string;
  slug: string;
  name: string;
  rank: number | null;
  marketCapUsd: number | null;
  priceUsd: number | null;
  change1dPct: number | null;
  change1yPct: number | null;
  country: string | null;
  logoUrl: string | null;
  categories: string[];
  description: string | null;
  history: YearlyMarketCap[];
  detailScrapedAt: Date;
}

export interface Meta {
  _id: "companies";
  lastScrapedAt: Date;
}
