import { useState, useEffect, useRef, useCallback } from "react";

interface UsePaginationOptions<T> {
  items: T[];
  pageSize?: number;
}

interface UsePaginationReturn<T> {
  visible: T[];
  total: number;
  hasMore: boolean;
  loadMore: () => void;
  sentinelRef: React.RefObject<HTMLDivElement>;
}

export function usePagination<T>({ items, pageSize = 20 }: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [displayCount, setDisplayCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset when items change (e.g. tab switch)
  useEffect(() => {
    setDisplayCount(pageSize);
  }, [items.length, pageSize]);

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + pageSize, items.length));
  }, [pageSize, items.length]);

  // IntersectionObserver for auto-load
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < items.length) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [displayCount, items.length, loadMore]);

  return {
    visible: items.slice(0, displayCount),
    total: items.length,
    hasMore: displayCount < items.length,
    loadMore,
    sentinelRef,
  };
}
