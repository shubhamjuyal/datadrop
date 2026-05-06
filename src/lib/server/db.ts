import { MongoClient, Collection } from "mongodb";
import { config } from "./config";
import type { Company, CompanyDetail, Meta } from "@/lib/types";

const globalForMongo = globalThis as unknown as { _mongoClient?: MongoClient };
let client: MongoClient | null = globalForMongo._mongoClient ?? null;

export async function connect(): Promise<MongoClient> {
  if (client) return client;
  const c = new MongoClient(config.mongoUri);
  await c.connect();
  client = c;

  if (process.env.NODE_ENV !== "production") {
    globalForMongo._mongoClient = client;
  }

  await companies().createIndex({ symbol: 1 }, { unique: true });
  await companies().createIndex({ rank: 1 });
  await companyDetails().createIndex({ symbol: 1 }, { unique: true });

  return c;
}

function db() {
  if (!client) throw new Error("Mongo not connected — call connect() first");
  return client.db();
}

export function companies(): Collection<Company> {
  return db().collection<Company>("companies");
}

export function companyDetails(): Collection<CompanyDetail> {
  return db().collection<CompanyDetail>("company_details");
}

export function meta(): Collection<Meta> {
  return db().collection<Meta>("meta");
}
