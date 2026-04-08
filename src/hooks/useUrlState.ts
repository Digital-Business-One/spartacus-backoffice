import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * URL search params bound to React state.
 *
 * Pattern (RFC-12 listings):
 * ```
 * const [search, setSearch] = useUrlState("q", "");
 * const [page, setPage] = useUrlNumber("page", 1);
 * ```
 *
 * The page itself owns its filters as URL params, which makes the
 * "voltar com filtros aplicados" requirement work for free: the back link
 * just navigates to the saved URL, and the page reads its own state from it.
 */
export function useUrlState(
  key: string,
  defaultValue = "",
): [string, (value: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (newValue: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (newValue === "" || newValue === defaultValue) {
            next.delete(key);
          } else {
            next.set(key, newValue);
          }
          // Reset pagination whenever a non-page filter changes
          if (key !== "page" && next.has("page")) {
            next.delete("page");
          }
          return next;
        },
        { replace: true },
      );
    },
    [key, defaultValue, setSearchParams],
  );

  return [value, setValue];
}

/** Numeric variant. `defaultValue` is returned for missing/invalid values. */
export function useUrlNumber(
  key: string,
  defaultValue = 1,
): [number, (value: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(key);
  const parsed = raw ? Number(raw) : NaN;
  const value = Number.isFinite(parsed) ? parsed : defaultValue;

  const setValue = useCallback(
    (newValue: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (newValue === defaultValue) {
            next.delete(key);
          } else {
            next.set(key, String(newValue));
          }
          return next;
        },
        { replace: true },
      );
    },
    [key, defaultValue, setSearchParams],
  );

  return [value, setValue];
}
