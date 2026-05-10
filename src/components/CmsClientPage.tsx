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
    <div className="min-h-screen px-4 py-10 text-white sm:px-6">
      <div className="mx-auto mb-8 flex w-full max-w-7xl justify-end">
        <button type="button" onClick={onLogout} className="btn-secondary px-5 py-2.5 text-sm">
          Log out
        </button>
      </div>
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-3xl border border-white/[0.1] bg-zinc-900/75 p-6 shadow-xl ring-1 ring-white/5 backdrop-blur-md sm:p-8">
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-white">Add content</h1>
          <p className="mb-6 text-sm text-zinc-400">Create a new catalog entry with streaming metadata.</p>
          <form onSubmit={onCreate} className="space-y-4">
            <input
              className="input-modern"
              placeholder="Title"
              value={draft.title}
              onChange={(event) => setDraftField("title", event.target.value)}
              required
            />
            <textarea
              className="input-modern min-h-[5.5rem] resize-y"
              placeholder="Description"
              value={draft.description}
              onChange={(event) => setDraftField("description", event.target.value)}
              required
              rows={3}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input-modern"
                placeholder="Genre"
                value={draft.genre}
                onChange={(event) => setDraftField("genre", event.target.value)}
                required
              />
              <input
                className="input-modern"
                placeholder="Year"
                value={draft.year}
                onChange={(event) => setDraftField("year", event.target.value)}
                required
              />
            </div>
            <input
              className="input-modern"
              placeholder="Poster URL"
              value={draft.posterSrc}
              onChange={(event) => setDraftField("posterSrc", event.target.value)}
              required
            />
            <input
              className="input-modern"
              placeholder="Stream URL"
              value={draft.streamUrl}
              onChange={(event) => setDraftField("streamUrl", event.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className="input-modern"
                value={draft.streamType}
                onChange={(event) => setDraftField("streamType", event.target.value as "mp4" | "hls" | "mpd")}
              >
                <option value="mp4">MP4</option>
                <option value="hls">HLS (m3u8)</option>
                <option value="mpd">MPD (DASH)</option>
              </select>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/12 bg-zinc-950/60 px-3.5 py-2.5 text-sm transition hover:border-white/18">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/25 bg-zinc-900 text-[#e50914] focus:ring-2 focus:ring-red-500/45"
                  checked={draft.featured}
                  onChange={(event) => setDraftField("featured", event.target.checked)}
                />
                Featured title
              </label>
            </div>
            {error ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={isSaving} className="btn-primary w-full py-3 disabled:opacity-60">
              {isSaving ? "Saving…" : "Create content"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-white/[0.1] bg-zinc-900/75 p-6 shadow-xl ring-1 ring-white/5 backdrop-blur-md sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Catalog entries</h2>
              <p className="mt-1 text-sm text-zinc-500">{items.length} total</p>
            </div>
            <Link href="/" className="btn-secondary px-4 py-2 text-sm no-underline">
              Back to app
            </Link>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/[0.08] bg-zinc-950/65 p-4 transition hover:border-white/14"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-zinc-500">
                      {item.genre} · {item.year} · {item.streamType.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleFeatured(item)}
                      className="btn-ghost px-3 py-1.5 text-xs"
                    >
                      {item.featured ? "Unfeature" : "Feature"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(item.id)}
                      className="rounded-full border border-rose-500/35 bg-rose-950/50 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-900/60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
