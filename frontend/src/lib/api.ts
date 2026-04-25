import type {
  ApiErrorBody,
  CompaniesResponse,
  CompanyDetailResponse,
} from "./types";

const BASE = "/api";

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(message: string, status: number, body: ApiErrorBody | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const errBody = (body && typeof body === "object" ? body : null) as ApiErrorBody | null;
    throw new ApiError(errBody?.error ?? `HTTP ${res.status}`, res.status, errBody);
  }
  return body as T;
}

export function fetchCompanies(limit: number): Promise<CompaniesResponse> {
  return request<CompaniesResponse>(`/companies?limit=${encodeURIComponent(limit)}`);
}

export function fetchCompany(symbol: string): Promise<CompanyDetailResponse> {
  return request<CompanyDetailResponse>(`/companies/${encodeURIComponent(symbol)}`);
}
