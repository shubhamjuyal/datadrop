# DataDrop

A small TypeScript REST service that scrapes the top companies by market cap from
[companiesmarketcap.com](https://companiesmarketcap.com) with Playwright, caches
them in MongoDB, and serves them through a clean HTTP API.

## Stack

- TypeScript, Express
- Playwright (Chromium, headless) for scraping
- MongoDB (native `mongodb` driver)
- `dotenv` for config, `tsx` for dev

## How it works

- The listing scraper pulls the top 100 companies from the homepage. Each request
  to `GET /companies?limit=N` returns the first `N` of those rows.
- A second scraper fetches the per-company detail page
  (`companiesmarketcap.com/{slug}/marketcap/`) and extracts headline stats,
  categories, description, and the end-of-year market cap history.
- Both scrapers cache their results in MongoDB with a 24-hour TTL. If the cached
  data is stale (or missing), the next matching request synchronously re-scrapes
  before responding. Concurrent requests during a stale window share a single
  in-flight scrape (no thundering herd).

## Setup

Prereqs: Node 20+, a MongoDB you can reach (local `mongod`, Docker container, or
Atlas).

```bash
npm install                              # installs deps + downloads Chromium
cp .env.example .env                     # edit MONGODB_URI if needed
npm run dev                              # tsx watch src/index.ts
```

A local MongoDB via Docker:

```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

### Environment variables

| Var                 | Default                                   | Purpose                          |
| ------------------- | ----------------------------------------- | -------------------------------- |
| `MONGODB_URI`       | (required)                                | Connection string (local/Atlas)  |
| `PORT`              | `3000`                                    | HTTP port                        |
| `CACHE_TTL_HOURS`   | `24`                                      | Data freshness window            |
| `SCRAPE_TIMEOUT_MS` | `30000`                                   | Per-scrape Playwright timeout    |

## API

### `GET /companies?limit=N`

Top `N` companies by market cap, ranked 1–`N`. `limit` defaults to `10`, capped
at `100`.

```bash
curl 'http://localhost:3000/companies?limit=3'
```

```json
{
  "count": 3,
  "lastScrapedAt": "2026-04-25T09:12:40.220Z",
  "stale": false,
  "companies": [
    {
      "symbol": "NVDA",
      "slug": "nvidia",
      "name": "NVIDIA",
      "rank": 1,
      "marketCapUsd": 5089000000000,
      "priceUsd": 209.39,
      "change24hPct": 4.88,
      "country": "USA",
      "logoUrl": "https://companiesmarketcap.com/img/company-logos/64/NVDA.webp"
    }
  ]
}
```

Errors: `400` on invalid `limit`, `503` if the scrape fails and there's no cache.
When the scrape fails but cached data exists, the payload is served with
`"stale": true`.

### `GET /companies/:symbol`

Detailed info for one company. Only symbols that appear in the top-100 listing
are supported.

```bash
curl http://localhost:3000/companies/NVDA
```

```json
{
  "stale": false,
  "company": {
    "symbol": "NVDA",
    "slug": "nvidia",
    "name": "NVIDIA",
    "rank": 1,
    "marketCapUsd": 5089000000000,
    "priceUsd": 209.41,
    "change1dPct": 4.89,
    "change1yPct": 103.92,
    "country": "United States",
    "logoUrl": "https://companiesmarketcap.com/img/company-logos/64/NVDA.webp",
    "categories": ["Semiconductors", "Tech", "Electronics", "AI"],
    "description": "Nvidia Corporation is one of the largest developers of...",
    "history": [
      { "year": 2026, "marketCapUsd": 5089000000000, "changePct": 9.72 },
      { "year": 2025, "marketCapUsd": 4638000000000, "changePct": 41.05 }
    ],
    "detailScrapedAt": "2026-04-25T09:13:02.511Z"
  }
}
```

Errors: `400` on an invalid symbol, `404` if the symbol is not in the current
top-100, `503` if the detail scrape fails with no cache. Serves stale cached
detail with `"stale": true` on transient scrape failures.

### `DELETE /companies`

Hard-deletes everything — `companies`, `company_details`, and `meta`. The next
`GET` will trigger a fresh scrape.

```bash
curl -X DELETE http://localhost:3000/companies
```

```json
{ "deleted": { "companies": 100, "meta": 1, "companyDetails": 3 } }
```

## Project layout

```
src/
├── index.ts              # entry: load env, connect Mongo, start Express
├── config.ts             # env parsing
├── db.ts                 # MongoClient singleton + collection helpers
├── types.ts              # Company / CompanyDetail interfaces
├── scraper.ts            # listing scraper (top 100)
├── detailScraper.ts      # per-company detail scraper
├── cache.ts              # staleness checks + in-flight dedup
└── routes/
    └── companies.ts      # GET /companies, GET /companies/:symbol, DELETE /companies
```

## Scripts

```
npm run dev         # tsx watch src/index.ts
npm run build       # tsc
npm start           # node dist/index.js
npm run typecheck   # tsc --noEmit
```
