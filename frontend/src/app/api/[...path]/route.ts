import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:3000";
const BYPASS =
  process.env.VERCEL_PROTECTION_BYPASS ??
  process.env.BYPASS_TOKEN ??
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

function getBypassToken(req: NextRequest): string | undefined {
  return (
    BYPASS ??
    req.headers.get("x-vercel-protection-bypass") ??
    req.cookies.get("__vercel_live_token")?.value ??
    undefined
  );
}

function buildTargetUrl(req: NextRequest, path: string[]): string {
  const raw = `${BACKEND_URL}/${path.join("/")}${req.nextUrl.search}`;
  const token = getBypassToken(req);
  if (!token) return raw;

  const url = new URL(raw);
  url.searchParams.set("x-vercel-protection-bypass", token);
  url.searchParams.set("x-vercel-set-bypass-cookie", "true");
  return url.toString();
}

function buildForwardHeaders(req: NextRequest, forceBypass: boolean): Record<string, string> {
  const headers: Record<string, string> = {};
  const incoming = req.headers;

  // Forward almost everything so upstream auth/protection can succeed.
  incoming.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "content-length" || lower === "connection") {
      return;
    }
    headers[key] = value;
  });

  headers.Accept = incoming.get("accept") ?? "application/json";

  const token = getBypassToken(req);

  if (token && (forceBypass || !incoming.get("x-vercel-protection-bypass"))) {
    headers["x-vercel-protection-bypass"] = token;
    headers["x-vercel-set-bypass-cookie"] = "true";
  }

  return headers;
}

async function proxyFetch(
  req: NextRequest,
  target: string,
  forceBypass: boolean,
  requestBody?: string,
): Promise<Response> {
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  return fetch(target, {
    method: req.method,
    headers: buildForwardHeaders(req, forceBypass),
    body: hasBody ? requestBody : undefined,
    cache: "no-store",
    redirect: "follow",
  });
}

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const target = buildTargetUrl(req, path);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const requestBody = hasBody ? await req.text() : undefined;

  let res: Response;
  try {
    res = await proxyFetch(req, target, false, requestBody);
    if (res.status === 401) {
      res = await proxyFetch(req, target, true, requestBody);
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: "Upstream unreachable",
        detail: `Failed to reach ${target}: ${err instanceof Error ? err.message : String(err)}`,
        backendUrlSet: Boolean(process.env.BACKEND_URL),
        bypassTokenSet: Boolean(BYPASS),
      },
      { status: 502 },
    );
  }

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
export const PUT = proxy;
