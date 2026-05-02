export type StreamType = "mp4" | "hls" | "mpd";

export type DrmType = "widevine" | "playready" | "fairplay";

export type DrmConfig = {
  type: DrmType;
  licenseUrl: string;
  headers?: Record<string, string>;
};

export type ContentItem = {
  id: string;
  title: string;
  description: string;
  category?: string;
  genre: string;
  year: number;
  featured: boolean;
  posterSrc: string;
  streamUrl?: string;
  playbackUrl?: string;
  streamType: StreamType;
  drm?: DrmConfig;
  episodes?: Array<{
    id: string;
    title: string;
    description: string;
    episodeNumber: number;
    seasonTitle?: string;
    streamUrl: string;
    streamType: StreamType;
    posterSrc: string;
    year: number;
  }>;
};

export type TvChannel = {
  id: string;
  sourceId?: string;
  title: string;
  posterSrc: string;
  group: string;
  streamType: StreamType;
  playbackUrl: string;
  drm?: DrmConfig;
};
