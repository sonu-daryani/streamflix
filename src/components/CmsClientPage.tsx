"use client";

import { FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCmsStore } from "@/stores/cmsStore";

export default function CmsClientPage() {
  const router = useRouter();
  const {
    items,
    draft,
    error,
    isSaving,
    loadItems,
    setDraftField,
    createItem,
    deleteItem,
    toggleFeatured,
    setError,
  } = useCmsStore();

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    await createItem();
  };

  const onDelete = async (id: string) => {
    await deleteItem(id);
  };

  const onLogout = async () => {
    await fetch("/api/cms-auth/logout", { method: "POST" });
    router.replace("/cms/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8 text-white">
      <div className="mx-auto mb-5 flex w-full max-w-7xl justify-end">
        <button
          type="button"
          onClick={onLogout}
          className="rounded bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
        >
          Logout
        </button>
      </div>
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-xl border border-white/10 bg-zinc-900/70 p-5">
          <h1 className="mb-4 text-2xl font-bold text-blue-400">CMS - Add Content</h1>
          <form onSubmit={onCreate} className="space-y-3">
            <input
              className="w-full rounded border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="Title"
              value={draft.title}
              onChange={(event) => setDraftField("title", event.target.value)}
              required
            />
            <textarea
              className="w-full rounded border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="Description"
              value={draft.description}
              onChange={(event) => setDraftField("description", event.target.value)}
              required
              rows={3}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
                placeholder="Genre"
                value={draft.genre}
                onChange={(event) => setDraftField("genre", event.target.value)}
                required
              />
              <input
                className="rounded border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
                placeholder="Year"
                value={draft.year}
                onChange={(event) => setDraftField("year", event.target.value)}
                required
              />
            </div>
            <input
              className="w-full rounded border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="Poster URL"
              value={draft.posterSrc}
              onChange={(event) => setDraftField("posterSrc", event.target.value)}
              required
            />
            <input
              className="w-full rounded border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="Stream URL"
              value={draft.streamUrl}
              onChange={(event) => setDraftField("streamUrl", event.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className="rounded border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
                value={draft.streamType}
                onChange={(event) => setDraftField("streamType", event.target.value as "mp4" | "hls" | "mpd")}
              >
                <option value="mp4">MP4</option>
                <option value="hls">HLS (m3u8)</option>
                <option value="mpd">MPD (DASH)</option>
              </select>
              <label className="flex items-center gap-2 rounded border border-white/15 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(event) => setDraftField("featured", event.target.checked)}
                />
                Featured title
              </label>
            </div>
            {error ? <p className="text-sm text-blue-300">{error}</p> : null}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Create Content"}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-white/10 bg-zinc-900/70 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Catalog Entries</h2>
            <Link
              href="/"
              className="rounded bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
            >
              Back to Frontend
            </Link>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-white/10 bg-zinc-950/80 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-zinc-400">
                      {item.genre} • {item.year} • {item.streamType.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleFeatured(item)}
                      className="rounded bg-zinc-800 px-3 py-1.5 text-xs hover:bg-zinc-700"
                    >
                      {item.featured ? "Unfeature" : "Feature"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(item.id)}
                      className="rounded bg-rose-700 px-3 py-1.5 text-xs hover:bg-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
