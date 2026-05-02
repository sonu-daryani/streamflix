import { randomUUID } from "crypto";
import type { Collection, Filter } from "mongodb";
import type { ContentItem, StreamType } from "@/lib/types";
import { CATALOG_COLLECTION, getDb } from "@/lib/mongo";

export type CatalogDocument = Omit<ContentItem, "id"> & { _id: string };

const streamTypes: StreamType[] = ["mp4", "hls", "mpd"];

export const isStreamType = (value: string): value is StreamType =>
  streamTypes.includes(value as StreamType);

type ListCatalogParams = {
  genre: string | null;
  category: string | null;
  type: string | null;
  featured: string | null;
  limit: number;
  page: number;
  isPaginated: boolean;
};

let indexesEnsured = false;

async function getCollection(): Promise<Collection<CatalogDocument>> {
  const db = await getDb();
  const coll = db.collection<CatalogDocument>(CATALOG_COLLECTION);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await coll.createIndexes([
      { key: { genre: 1 } },
      { key: { category: 1 } },
      { key: { featured: 1 } },
      { key: { streamType: 1 } },
    ]);
  }
  return coll;
}

function buildFilter(params: {
  genre: string | null;
  category: string | null;
  type: string | null;
  featured: string | null;
}): Filter<CatalogDocument> {
  const filter: Filter<CatalogDocument> = {};
  if (params.genre) filter.genre = params.genre;
  if (params.category) filter.category = params.category;
  if (params.type && isStreamType(params.type)) filter.streamType = params.type;
  if (params.featured === "true") filter.featured = true;
  return filter;
}

export async function listCatalogForApi(params: ListCatalogParams): Promise<{
  items: ContentItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}> {
  const coll = await getCollection();
  const filter = buildFilter(params);

  if (!params.isPaginated) {
    const items = await coll.find(filter).sort({ featured: -1, title: 1 }).toArray();
    const normalized = items.map(toContentItem);
    return {
      items: normalized,
      total: normalized.length,
      page: 0,
      limit: 0,
      hasMore: false,
    };
  }

  const skip = (params.page - 1) * params.limit;
  const [total, rows] = await Promise.all([
    coll.countDocuments(filter),
    coll
      .find(filter)
      .sort({ featured: -1, title: 1 })
      .skip(skip)
      .limit(params.limit)
      .toArray(),
  ]);

  const items = rows.map(toContentItem);
  const hasMore = skip + items.length < total;

  return {
    items,
    total,
    page: params.page,
    limit: params.limit,
    hasMore,
  };
}

function toContentItem(doc: CatalogDocument): ContentItem {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id };
}

export async function findCatalogItemById(id: string): Promise<ContentItem | null> {
  const coll = await getCollection();
  const doc = await coll.findOne({ _id: id });
  return doc ? toContentItem(doc) : null;
}

export async function createCatalogItem(
  input: Omit<ContentItem, "id">,
): Promise<ContentItem> {
  const coll = await getCollection();
  const id = randomUUID();
  const doc: CatalogDocument = {
    _id: id,
    ...input,
  };
  await coll.insertOne(doc);
  return toContentItem(doc);
}

export async function updateCatalogItem(
  id: string,
  patch: Partial<Omit<ContentItem, "id">>,
): Promise<ContentItem | null> {
  const coll = await getCollection();
  const existing = await coll.findOne({ _id: id });
  if (!existing) return null;

  const next: CatalogDocument = {
    ...existing,
    ...patch,
    _id: id,
  };
  await coll.replaceOne({ _id: id }, next);
  return toContentItem(next);
}

export async function deleteCatalogItem(id: string): Promise<boolean> {
  const coll = await getCollection();
  const result = await coll.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

export async function getRelatedCatalogItems(
  excludeId: string,
  genre: string,
  limit: number,
): Promise<ContentItem[]> {
  const coll = await getCollection();
  const rows = await coll
    .find({
      genre,
      _id: { $ne: excludeId },
    })
    .limit(limit)
    .toArray();
  return rows.map(toContentItem);
}

export async function getDistinctGenres(): Promise<string[]> {
  const coll = await getCollection();
  const genres = await coll.distinct("genre", {});
  return genres
    .filter((g: unknown): g is string => typeof g === "string" && g.length > 0)
    .sort((a: string, b: string) => a.localeCompare(b));
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchCatalogItems(
  q: string,
  genre: string | null,
  typeFilter: StreamType | null,
): Promise<ContentItem[]> {
  const coll = await getCollection();
  const filter: Filter<CatalogDocument> = {};

  if (q.trim()) {
    filter.$or = [
      { title: { $regex: escapeRegex(q.trim()), $options: "i" } },
      { description: { $regex: escapeRegex(q.trim()), $options: "i" } },
    ];
  }
  if (genre) filter.genre = genre;
  if (typeFilter) filter.streamType = typeFilter;

  const rows = await coll.find(filter).sort({ title: 1 }).limit(200).toArray();
  return rows.map(toContentItem);
}
