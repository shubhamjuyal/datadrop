import { MongoClient, Collection } from "mongodb";
import { config } from "./config";
import type { Company, CompanyDetail, Meta } from "@/lib/types";

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

let clientPromise: Promise<MongoClient> | null =
  globalForMongo._mongoClientPromise ?? null;

export function connect(): Promise<MongoClient> {
  if (clientPromise) return clientPromise;

  const c = new MongoClient(config.mongoUri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
  });

  clientPromise = c.connect().then(async (connected) => {
    await connected.db().collection("companies").createIndex({ symbol: 1 }, { unique: true });
    await connected.db().collection("companies").createIndex({ rank: 1 });
    await connected.db().collection("company_details").createIndex({ symbol: 1 }, { unique: true });
    return connected;
  }).catch((err) => {
    clientPromise = null;
    globalForMongo._mongoClientPromise = undefined;
    throw err;
  });

  globalForMongo._mongoClientPromise = clientPromise;
  return clientPromise;
}

function db(client: MongoClient) {
  return client.db();
}

export async function companies(): Promise<Collection<Company>> {
  const client = await connect();
  return db(client).collection<Company>("companies");
}

export async function companyDetails(): Promise<Collection<CompanyDetail>> {
  const client = await connect();
  return db(client).collection<CompanyDetail>("company_details");
}

export async function meta(): Promise<Collection<Meta>> {
  const client = await connect();
  return db(client).collection<Meta>("meta");
}
