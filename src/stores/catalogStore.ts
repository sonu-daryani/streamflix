"use client";

import { create } from "zustand";
import type { ContentItem } from "@/lib/types";

type CatalogState = {
  items: ContentItem[];
  genres: string[];
  selectedGenre: string;
  query: string;
  isLoading: boolean;
  setQuery: (query: string) => void;
  loadInitial: () => Promise<void>;
  loadCatalog: (genre?: string, query?: string) => Promise<void>;
  setSelectedGenre: (genre: string) => void;
};

export const useCatalogStore = create<CatalogState>((set, get) => ({
  items: [],
  genres: [],
  selectedGenre: "all",
  query: "",
  isLoading: true,
  setQuery: (query) => set({ query }),
  setSelectedGenre: (selectedGenre) => set({ selectedGenre }),
  loadInitial: async () => {
    set({ isLoading: true });
    const [genresResponse, contentResponse] = await Promise.all([
      fetch("/api/genres"),
      fetch("/api/content"),
    ]);
    const genresData = (await genresResponse.json()) as { genres: string[] };
    const contentData = (await contentResponse.json()) as { items: ContentItem[] };
    set({
      genres: genresData.genres,
      items: contentData.items,
      isLoading: false,
    });
  },
  loadCatalog: async (nextGenre, nextQuery) => {
    set({ isLoading: true });
    const genre = nextGenre ?? get().selectedGenre;
    const query = nextQuery ?? get().query;
    const endpoint = query
      ? `/api/search?q=${encodeURIComponent(query)}${genre !== "all" ? `&genre=${encodeURIComponent(genre)}` : ""}`
      : `/api/content${genre !== "all" ? `?genre=${encodeURIComponent(genre)}` : ""}`;

    const response = await fetch(endpoint);
    const data = (await response.json()) as { items: ContentItem[] };
    set({
      items: data.items,
      isLoading: false,
      ...(nextGenre ? { selectedGenre: nextGenre } : {}),
      ...(nextQuery !== undefined ? { query: nextQuery } : {}),
    });
  },
}));
