#!/usr/bin/env python3
import argparse
import json
import time
from typing import List
from urllib import error, parse, request


SYMBOLS: List[str] = [
    "NVDA","GOOG","AAPL","MSFT","AMZN","TSM","AVGO","2222.SR","META","TSLA",
    "WMT","BRK-B","005930.KS","JPM","LLY","XOM","V","000660.KS","AMD","TCEHY",
    "ASML","MU","JNJ","ORCL","MA","COST","INTC","NFLX","CAT","601939.SS",
    "BAC","CVX","601288.SS","CSCO","ABBV","PG","PLTR","LRCX","RO.SW","HD",
    "BABA","AMAT","1398.HK","KO","UNH","HSBC","GEV","MS","300750.SZ","GE",
    "AZN","NVS","MRK","GS","601988.SS","MC.PA","600519.SS","NESN.SW","0857.HK","PM",
    "KLAC","TXN","TM","SHEL","ARM","RY","WFC","OR.PA","LIN","IHC.AE",
    "RTX","0941.HK","ANET","C","SIE.DE","IBM","AXP","MCD","9984.T","PEP",
    "PRX.AS","TMUS","CBA.AX","SAP","BHP","RMS.PA","NEE","ADI","MUFG","VZ",
    "ITX.MC","RELIANCE.NS","TTE","601138.SS","ENR.F","AMGN","APH","BA","T","DIS"
]


def get(url: str, timeout: float) -> tuple[bool, int, str]:
    req = request.Request(url, method="GET")
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            return True, resp.status, body
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return False, exc.code, body
    except error.URLError as exc:
        return False, 0, str(exc.reason)
    except TimeoutError:
        return False, 0, "request timed out"


def run_once(base_url: str, timeout: float, delay_ms: int) -> None:
    base = base_url.rstrip("/")

    print(f"\n=== GET /companies?limit=100 ===")
    ok, status, body = get(f"{base}/companies?limit=100", timeout)
    print(f"HTTP {status} {'OK' if ok else 'FAIL'} — {len(body)} bytes")

    print(f"\n=== GET /companies/:symbol ({len(SYMBOLS)} symbols) ===")
    ok_count = 0
    failures: list[dict[str, object]] = []

    for i, symbol in enumerate(SYMBOLS, start=1):
        url = f"{base}/companies/{parse.quote(symbol, safe='')}"
        ok, status, body = get(url, timeout)
        if ok:
            ok_count += 1
            print(f"[{i:03d}/{len(SYMBOLS)}] OK   {symbol} (HTTP {status})")
        else:
            short = body.strip().replace("\n", " ")
            short = short[:220] + ("..." if len(short) > 220 else "")
            print(f"[{i:03d}/{len(SYMBOLS)}] FAIL {symbol} (HTTP {status}) {short}")
            failures.append({"symbol": symbol, "status": status, "error": short})

        if i < len(SYMBOLS) and delay_ms > 0:
            time.sleep(delay_ms / 1000.0)

    print(f"\nDone. Success: {ok_count}/{len(SYMBOLS)}  Failed: {len(failures)}")
    if failures:
        print(json.dumps(failures, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Cron: call /companies?limit=100 then /companies/:symbol for every symbol."
    )
    parser.add_argument("--base-url", default="http://localhost:3000")
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument("--delay-ms", type=int, default=150,
                        help="Delay between symbol requests in ms (default: 150)")
    parser.add_argument("--interval", type=int, default=0,
                        help="Repeat every N seconds. 0 = run once (default: 0)")
    args = parser.parse_args()

    if args.interval <= 0:
        run_once(args.base_url, args.timeout, args.delay_ms)
        return

    print(f"Running every {args.interval}s against {args.base_url}. Ctrl-C to stop.")
    while True:
        start = time.time()
        run_once(args.base_url, args.timeout, args.delay_ms)
        elapsed = time.time() - start
        wait = max(0.0, args.interval - elapsed)
        if wait:
            print(f"Sleeping {wait:.1f}s until next run…")
            time.sleep(wait)


if __name__ == "__main__":
    main()
