"use client";

import dynamic from "next/dynamic";
import type { DrmConfig } from "@/lib/types";
import type { StreamPlayerProps } from "hls-react-player";

const BaseStreamPlayer = dynamic<StreamPlayerProps>(
  () => import("hls-react-player").then((mod) => mod.StreamPlayer),
  {
    ssr: false,
  },
);

type AppStreamPlayerProps = StreamPlayerProps & {
  drmConfig?: DrmConfig;
};

export default function StreamPlayer({ drmConfig, ...playerProps }: AppStreamPlayerProps) {
  return (
    <div className="space-y-2">
      {drmConfig ? (
        <p className="text-xs text-zinc-400">
          DRM configured: {drmConfig.type.toUpperCase()} via license server.
        </p>
      ) : null}
      <BaseStreamPlayer {...playerProps} />
    </div>
  );
}

export type { StreamPlayerProps, StreamType } from "hls-react-player";
