import { MongoClient, type Db } from "mongodb";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to .env (see .env.example).");
  }
  return uri;
}

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = getMongoUri();
  if (!globalThis.__mongoClientPromise) {
    const client = new MongoClient(uri);
    globalThis.__mongoClientPromise = client.connect();
  }
  return globalThis.__mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const override = process.env.MONGODB_DB_NAME?.trim();
  if (override) {
    return client.db(override);
  }
  return client.db();
}

export const CATALOG_COLLECTION = "catalog";
