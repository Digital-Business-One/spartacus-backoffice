import { Link, useLocation } from "react-router-dom";

interface BackLinkProps {
  /** Fallback URL if no `from` query param is present (e.g. "/em-analise") */
  fallback: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reads `?from=<encoded-url>` from the current location and links back to it.
 *
 * Used by AccountDetailPage to honor the "voltar com filtros aplicados"
 * requirement of RFC-12. The listing page builds the from URL as the full
 * `pathname + search`, which preserves filters and pagination naturally.
 *
 * If `from` is missing or malformed, falls back to the given URL.
 */
export function BackLink({ fallback, children, className }: BackLinkProps) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const fromParam = params.get("from");

  let target = fallback;
  if (fromParam) {
    try {
      const decoded = decodeURIComponent(fromParam);
      // Only allow same-origin paths (defense in depth — never an external URL)
      if (decoded.startsWith("/")) {
        target = decoded;
      }
    } catch {
      // Malformed encoding — keep the fallback
    }
  }

  return (
    <Link to={target} className={className ?? "back-link"}>
      {children}
    </Link>
  );
}
