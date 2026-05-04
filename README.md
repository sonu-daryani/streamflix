## StreamFlix

Netflix-style streaming platform built with Next.js, a **MongoDB**-backed catalog, HLS/MPD custom player support, CMS APIs, and Zustand state management.
---
<img width="1791" height="1077" alt="Screenshot 2026-05-04 at 1 59 03 PM" src="https://github.com/user-attachments/assets/85dca20e-89c7-47ff-817c-920c815012cc" />

---
<img width="898" height="519" alt="Screenshot 2026-05-04 at 1 59 34 PM" src="https://github.com/user-attachments/assets/56116d78-1068-4fe6-8ff4-b9a098ec1889" />

---


## Environment

Copy `.env.example` to `.env` and set:

- `MONGODB_URI` — e.g. `mongodb://127.0.0.1:27017` (or your Atlas URI)
- `MONGODB_DB_NAME` — database name (default: `streamflix`)
- `STREAM_SIGNING_SECRET`, `CMS_SESSION_SECRET`, and CMS admin credentials

## Database

Start MongoDB locally, for example:

```bash
docker compose up -d
```

The app reads and writes catalog items in the `catalog` collection. APIs use the same environment variables in development and production.

## Catalog data and MX seed

1. **Seed from MX Player (optional)** — when `MX_HOME_TAB_URL` is set to a working tab/section API URL, `npm run seed:mx` walks the JSON, calls the detail API for each title, and upserts into MongoDB. If the network or region blocks those APIs, the script falls back to a small **demo** catalog (public test HLS streams) so the app still runs.

2. **Import a JSON file** — set `MX_CATALOG_JSON_PATH` to a file containing a JSON **array** of `ContentItem` objects, then run `npm run seed:mx` to replace the `catalog` collection with that data.

3. **Reset to demo only** — run `npm run seed:mx` without `MX_HOME_TAB_URL` and without `MX_CATALOG_JSON_PATH` to load the built-in demo catalog.

```bash
npm run seed:mx
```

## Run app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and CMS at [http://localhost:3000/cms](http://localhost:3000/cms).

## APIs

- `GET /api/content` (+ `genre`, `category`, `type`, `featured`, `limit`, `page`)
- `POST /api/content`
- `GET /api/content/:id`
- `PATCH /api/content/:id`
- `DELETE /api/content/:id`
- `GET /api/content/:id/related`
- `GET /api/genres`
- `GET /api/search?q=...`

## State management

- `src/stores/catalogStore.ts` handles homepage catalog/search/genre state.
- `src/stores/cmsStore.ts` handles CMS list + form state/actions.
