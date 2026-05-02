import { useEffect, useRef } from "react";

type UseInfiniteScrollOptions = {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void | Promise<void>;
  rootMargin?: string;
};

export default function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = "300px",
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pendingLoadRef = useRef(false);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || pendingLoadRef.current) return;
        pendingLoadRef.current = true;
        void Promise.resolve(onLoadMore()).finally(() => {
          pendingLoadRef.current = false;
        });
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, rootMargin]);

  return { sentinelRef };
}
