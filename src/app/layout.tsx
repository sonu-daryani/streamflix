import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "hls-react-player/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StreamFlix | Next.js Streaming Platform",
  description: "A Netflix-style streaming platform demo with a custom player.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Suspense
          fallback={
            <div
              className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-[#121212] px-6"
              aria-busy
              aria-label="Loading"
            >
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[#e50914]" />
              <p className="text-sm text-zinc-500">Loading…</p>
            </div>
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  );
}
