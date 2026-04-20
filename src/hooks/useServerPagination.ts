import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

/**
 * Envelope returned by the backend RFC-12 paginated listings.
 *
 * `pageSize` and `totalPages` use camelCase from the backend serializer.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface UseServerPaginationOptions {
  /** Endpoint path without query string, e.g. "/accounts" */
  endpoint: string;
  /** Filter params (omit `page` and `pageSize` — they come from `page` arg) */
  params?: Record<string, string | number | undefined | null>;
  /** Current page (1-indexed) */
  page: number;
  /** Items per page (default 20, max 50) */
  pageSize?: number;
}

interface UseServerPaginationReturn<T> {
  data: PaginatedResponse<T> | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches a paginated listing from the backend (RFC-12 envelope contract).
 *
 * The hook re-fetches whenever the resolved query string changes.
 * Pages are stable: navigating away and back with the same params yields
 * the same data, so it composes well with URL search params.
 */
export function useServerPagination<T>({
  endpoint,
  params,
  page,
  pageSize = 20,
}: UseServerPaginationOptions): UseServerPaginationReturn<T> {
  const [data, setData] = useState<PaginatedResponse<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build a stable query string so the effect only re-runs when filters
  // actually change (param order would otherwise re-trigger).
  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          qs.set(key, String(value));
        }
      }
    }
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));
    return qs.toString();
  }, [params, page, pageSize]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.get<PaginatedResponse<T>>(
        `${endpoint}?${queryString}`,
      );
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
      setData({
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, queryString, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
