interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  itemLabel?: string;       // singular, e.g. "registro"
  itemLabelPlural?: string; // plural, e.g. "registros"
  onChange: (page: number) => void;
}

/**
 * Server-side pagination control used by RFC-12 listings.
 *
 * Renders ←  1 … 4 5 6 … 10  → with the current page highlighted.
 * Hidden when there's only one page.
 */
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  itemLabel = "registro",
  itemLabelPlural = "registros",
  onChange,
}: PaginationProps) {
  if (totalPages <= 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = buildPageList(page, totalPages);

  return (
    <div className="pagination">
      <div className="pagination-info">
        Exibindo {start}–{end} de {total}{" "}
        {total === 1 ? itemLabel : itemLabelPlural}
      </div>
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            ‹
          </button>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="pagination-ellipsis">
                …
              </span>
            ) : (
              <button
                key={p}
                className={`pagination-btn ${p === page ? "active" : ""}`}
                onClick={() => onChange(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            ),
          )}
          <button
            className="pagination-btn"
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Próxima página"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

/** Build the page list with ellipsis. Always shows first/last + neighborhood. */
function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const result: (number | "…")[] = [1];
  if (current > 4) result.push("…");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) result.push(p);
  if (current < total - 3) result.push("…");
  result.push(total);
  return result;
}
