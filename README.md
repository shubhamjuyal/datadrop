# DataDrop

REST API + playground UI that scrapes top companies by market cap from [companiesmarketcap.com](https://companiesmarketcap.com) and serves them via a Next.js monolith.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and set your `MONGODB_URI`.

```bash
npm run dev
```

Opens on [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | *(required)* | MongoDB connection string |
| `CACHE_TTL_HOURS` | `24` | Hours before cached data is considered stale |
| `SCRAPE_TIMEOUT_MS` | `30000` | Playwright navigation timeout in ms |

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/companies?limit=N` | Top N companies (1-100, default 10) |
| `GET` | `/api/companies/:symbol` | Detailed info for one company |
| `DELETE` | `/api/companies` | Clear all cached data |

## Architecture

Single Next.js 16 app with:
- **API routes** (`src/app/api/`) — serve company data from MongoDB
- **Playwright scrapers** (`src/lib/server/`) — headless Chromium scrapes companiesmarketcap.com on cache miss
- **React frontend** (`src/app/`, `src/components/`) — playground UI with shadcn/ui
- **MongoDB** — caches scraped data with configurable TTL
