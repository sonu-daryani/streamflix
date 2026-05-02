"use client";

import { create } from "zustand";
import type { ContentItem, StreamType } from "@/lib/types";

export type DraftItem = {
  title: string;
  description: string;
  genre: string;
  year: string;
  featured: boolean;
  posterSrc: string;
  streamUrl: string;
  streamType: StreamType;
};

export const initialDraft: DraftItem = {
  title: "",
  description: "",
  genre: "",
  year: String(new Date().getFullYear()),
  featured: false,
  posterSrc: "",
  streamUrl: "",
  streamType: "mp4",
};

type CmsState = {
  items: ContentItem[];
  draft: DraftItem;
  error: string;
  isSaving: boolean;
  loadItems: () => Promise<void>;
  setDraftField: <K extends keyof DraftItem>(key: K, value: DraftItem[K]) => void;
  setError: (message: string) => void;
  createItem: () => Promise<boolean>;
  deleteItem: (id: string) => Promise<void>;
  toggleFeatured: (item: ContentItem) => Promise<void>;
};

export const useCmsStore = create<CmsState>((set, get) => ({
  items: [],
  draft: initialDraft,
  error: "",
  isSaving: false,
  setError: (message) => set({ error: message }),
  setDraftField: (key, value) =>
    set((state) => ({ draft: { ...state.draft, [key]: value } })),
  loadItems: async () => {
    const response = await fetch("/api/content");
    const data = (await response.json()) as { items: ContentItem[] };
    set({ items: data.items });
  },
  createItem: async () => {
    set({ error: "", isSaving: true });
    const draft = get().draft;
    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, year: Number(draft.year) }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      set({
        error: payload.message ?? "Unable to create content.",
        isSaving: false,
      });
      return false;
    }

    await get().loadItems();
    set({ draft: initialDraft, isSaving: false });
    return true;
  },
  deleteItem: async (id) => {
    await fetch(`/api/content/${id}`, { method: "DELETE" });
    await get().loadItems();
  },
  toggleFeatured: async (item) => {
    await fetch(`/api/content/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !item.featured }),
    });
    await get().loadItems();
  },
}));
