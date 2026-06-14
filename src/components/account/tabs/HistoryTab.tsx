import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { ChipGroup, FiltersDrawer } from "../FiltersDrawer";
import { formatDateTime } from "../types";

interface HistoryTabProps {
  uid: string;
}

interface HistoryEntry {
  id: string;
  projectId: string;
  eventType: string;
  eventSubtype?: string | null;
  actorUid: string;
  actorName: string;
  actorRoles: string[];
  description: string;
  createdAt: string;
}

interface HistoryPage {
  items: HistoryEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const EVENT_TYPE_OPTIONS = [
  { value: "creation", label: "Criação" },
  { value: "edit", label: "Edição" },
  { value: "approval", label: "Aprovação" },
  { value: "warning", label: "Advertência" },
  { value: "suspension", label: "Suspensão" },
  { value: "graduation", label: "Graduação" },
  { value: "donation", label: "Doação" },
  { value: "attendance", label: "Presença" },
];

const EVENT_TYPE_ICON: Record<string, string> = {
  creation: "✨",
  edit: "✏️",
  approval: "✓",
  warning: "⚠️",
  suspension: "🚫",
  graduation: "🥋",
  donation: "💝",
  attendance: "📅",
  account: "👤",
};

const EVENT_TYPE_COLOR: Record<string, string> = {
  creation: "var(--gold)",
  edit: "var(--text-muted)",
  approval: "var(--success)",
  warning: "#f59e0b",
  suspension: "var(--error)",
  graduation: "var(--gold)",
  donation: "var(--gold)",
  attendance: "var(--gold)",
  account: "var(--text-muted)",
};

const MONTH_OPTIONS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Fev" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Abr" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Ago" },
  { value: 9, label: "Set" },
  { value: 10, label: "Out" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dez" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR].map(
  (y) => ({ value: y, label: String(y) }),
);

const PAGE_SIZE = 20;

export function HistoryTab({ uid }: HistoryTabProps) {
  // Filter state (applied)
  const [year, setYear] = useState<number | null>(null);
  const [months, setMonths] = useState<number[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftYear, setDraftYear] = useState<number | null>(null);
  const [draftMonths, setDraftMonths] = useState<number[]>([]);
  const [draftTypes, setDraftTypes] = useState<string[]>([]);

  // Data state
  const [data, setData] = useState<HistoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (year !== null) params.set("year", String(year));
      if (months.length > 0) params.set("months", months.join(","));
      if (types.length > 0) params.set("types", types.join(","));
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      const result = await api.get<HistoryPage>(
        `/accounts/${uid}/history?${params.toString()}`,
      );
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [uid, year, months, types, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  function openDrawer() {
    setDraftYear(year);
    setDraftMonths(months);
    setDraftTypes(types);
    setDrawerOpen(true);
  }

  function applyFilters() {
    setYear(draftYear);
    setMonths(draftMonths);
    setTypes(draftTypes);
    setPage(1);
    setDrawerOpen(false);
  }

  function resetFilters() {
    setDraftYear(null);
    setDraftMonths([]);
    setDraftTypes([]);
  }

  const activeFilterCount =
    (year !== null ? 1 : 0) +
    (months.length > 0 ? 1 : 0) +
    (types.length > 0 ? 1 : 0);

  if (loading && !data) {
    return (
      <div className="hub-loading">
        <span className="loading-spinner" style={{ width: 24, height: 24 }} />
        <span>Carregando histórico...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-empty-tab">
        <div style={{ fontSize: "2rem" }}>⚠️</div>
        <p>{error}</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="detail-tab-content">
      {/* Active filter chips + open drawer button */}
      <div className="att-filter-bar">
        <div className="att-active-filters">
          {year !== null && (
            <span className="filter-chip active">{year}</span>
          )}
          {months.length > 0 && (
            <span className="filter-chip active">
              {months
                .sort((a, b) => a - b)
                .map((m) => MONTH_OPTIONS[m - 1].label)
                .join(", ")}
            </span>
          )}
          {types.length > 0 && (
            <span className="filter-chip active">
              {types
                .map(
                  (t) => EVENT_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t,
                )
                .join(", ")}
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={openDrawer}
        >
          ⚙ Filtros{activeFilterCount > 0 && ` (${activeFilterCount})`}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="detail-empty-tab">
          <div style={{ fontSize: "2rem" }}>🕒</div>
          <h3 style={{ margin: "0.5rem 0", color: "var(--text-primary)" }}>
            Nenhum evento no histórico
          </h3>
          <p>
            Os eventos da conta (criação, aprovação, doações, presenças)
            aparecerão aqui conforme acontecerem.
          </p>
        </div>
      ) : (
        <>
          <div className="history-timeline">
            {items.map((entry, idx) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                isLast={idx === items.length - 1}
              />
            ))}
          </div>

          {/* Simple pagination footer */}
          {data && data.totalPages > 1 && (
            <div className="history-pagination">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ‹ Anterior
              </button>
              <span className="pagination-info">
                Página {data.page} de {data.totalPages} — {data.total} eventos
              </span>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages}
              >
                Próxima ›
              </button>
            </div>
          )}
        </>
      )}

      {/* Filters drawer */}
      <FiltersDrawer
        open={drawerOpen}
        title="Filtros"
        onClose={() => setDrawerOpen(false)}
        onApply={applyFilters}
        onReset={resetFilters}
      >
        <div className="filters-drawer-section">
          <h4 className="filters-drawer-section-title">Período</h4>
          <div className="filters-drawer-subtitle">Ano</div>
          <ChipGroup
            options={YEAR_OPTIONS}
            selected={draftYear !== null ? [draftYear] : []}
            onChange={(sel) => setDraftYear(sel[0] ?? null)}
          />
          <div className="filters-drawer-subtitle">Mês</div>
          <ChipGroup
            options={MONTH_OPTIONS}
            selected={draftMonths}
            onChange={setDraftMonths}
            multi
          />
        </div>
        <div className="filters-drawer-section">
          <h4 className="filters-drawer-section-title">Tipo de evento</h4>
          <ChipGroup
            options={EVENT_TYPE_OPTIONS}
            selected={draftTypes}
            onChange={setDraftTypes}
            multi
          />
        </div>
      </FiltersDrawer>
    </div>
  );
}

function HistoryItem({
  entry,
  isLast,
}: {
  entry: HistoryEntry;
  isLast: boolean;
}) {
  const icon = EVENT_TYPE_ICON[entry.eventType] ?? "•";
  const color = EVENT_TYPE_COLOR[entry.eventType] ?? "var(--text-muted)";
  return (
    <div className="history-item">
      <div className="history-item-marker">
        <div
          className="history-item-icon"
          style={{ borderColor: color, color }}
        >
          {icon}
        </div>
        {!isLast && <div className="history-item-line" />}
      </div>
      <div className="history-item-body">
        <div className="history-item-description">{entry.description}</div>
        <div className="history-item-meta">
          <span>{formatDateTime(entry.createdAt)}</span>
          {entry.actorName && entry.actorUid !== "system" && (
            <>
              <span> · </span>
              <span>por {entry.actorName}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
