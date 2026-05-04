"use client";

import dynamic from "next/dynamic";
import type { StreamPlayerProps } from "hls-react-player";

const BaseStreamPlayer = dynamic<StreamPlayerProps>(
  () => import("hls-react-player").then((mod) => mod.StreamPlayer),
  { ssr: false },
);

export default function StreamPlayer(props: StreamPlayerProps) {
  return <BaseStreamPlayer {...props} />;
}

export type { StreamPlayerProps, StreamType } from "hls-react-player";
