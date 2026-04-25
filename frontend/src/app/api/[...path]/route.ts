import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";
const BYPASS = process.env.VERCEL_PROTECTION_BYPASS;

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const search = req.nextUrl.search;
  const target = `${BACKEND_URL}/${path.join("/")}${search}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (BYPASS) {
    headers["x-vercel-protection-bypass"] = BYPASS;
    headers["x-vercel-set-bypass-cookie"] = "true";
  }

  let res: Response;
  try {
    res = await fetch(target, {
      method: req.method,
      headers,
      cache: "no-store",
    });
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
