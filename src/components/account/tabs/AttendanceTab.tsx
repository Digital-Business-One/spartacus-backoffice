import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import { AttendanceCalendar, type CalendarRecord } from "../AttendanceCalendar";
import { ChipGroup, FiltersDrawer } from "../FiltersDrawer";

interface AttendanceTabProps {
  uid: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  dateSort: string;
  time?: string | null;
  classId: string;
  className: string;
  modalityName: string;
  teacherName?: string | null;
  status: string;
  statusLabel: string;
  validatedBy?: string | null;
  validatedByName?: string | null;
  validatedAt?: string | null;
  justification?: string | null;
}

interface MonthSummary {
  month: string;
  monthLabel: string;
  attended: number;
  total: number;
  percent: number;
  records: AttendanceRecord[];
}

interface AttendanceHistoryResponse {
  streakDays: number;
  overallPercent: number;
  months: MonthSummary[];
}

const STATUS_VARIANT: Record<string, string> = {
  registered: "warning",
  confirmed: "success",
  absent: "error",
  absent_justified: "muted",
};

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmado" },
  { value: "registered", label: "Aguardando confirmação" },
  { value: "absent", label: "Não confirmado" },
  { value: "absent_justified", label: "Justificado" },
];

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

export function AttendanceTab({ uid }: AttendanceTabProps) {
  // Filter state (applied)
  const [year, setYear] = useState<number | null>(null);
  const [months, setMonths] = useState<number[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftYear, setDraftYear] = useState<number | null>(null);
  const [draftMonths, setDraftMonths] = useState<number[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);

  // Data state
  const [data, setData] = useState<AttendanceHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (year !== null) params.set("year", String(year));
      if (months.length > 0) params.set("months", months.join(","));
      if (statuses.length > 0) params.set("statuses", statuses.join(","));
      const path = `/accounts/${uid}/attendance/history${params.toString() ? `?${params}` : ""}`;
      const result = await api.get<AttendanceHistoryResponse>(path);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [uid, year, months, statuses]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  function openDrawer() {
    setDraftYear(year);
    setDraftMonths(months);
    setDraftStatuses(statuses);
    setDrawerOpen(true);
  }

  function applyFilters() {
    setYear(draftYear);
    setMonths(draftMonths);
    setStatuses(draftStatuses);
    setDrawerOpen(false);
  }

  function resetFilters() {
    setDraftYear(null);
    setDraftMonths([]);
    setDraftStatuses([]);
  }

  async function handleValidate(recordId: string, status: "confirmed" | "absent") {
    setValidatingId(recordId);
    try {
      await api.patch(`/attendance/${recordId}/validate`, { status });
      await fetchHistory();
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : "Erro ao validar");
    } finally {
      setValidatingId(null);
    }
  }

  // Flatten all records for the table
  const allRecords = useMemo(() => {
    if (!data) return [];
    return data.months.flatMap((m) => m.records);
  }, [data]);

  // Aggregate counts for stat cards
  const stats = useMemo(() => {
    let confirmed = 0;
    let absent = 0;
    let total = 0;
    for (const r of allRecords) {
      total++;
      if (r.status === "confirmed" || r.status === "registered") confirmed++;
      else if (r.status === "absent") absent++;
    }
    const overall = data?.overallPercent ?? 0;
    return { confirmed, absent, total, overall };
  }, [allRecords, data]);

  // Calendar records (only real attendance, not synthetic absent placeholders)
  const calendarRecords = useMemo<CalendarRecord[]>(
    () =>
      allRecords
        .filter((r) => !r.id.startsWith("absent_"))
        .map((r) => ({ dateSort: r.dateSort, status: r.status })),
    [allRecords],
  );

  // Calendar starts at the oldest selected month
  const { calendarYear, calendarMonth } = useMemo(() => {
    if (year !== null && months.length > 0) {
      const oldest = Math.min(...months);
      return { calendarYear: year, calendarMonth: oldest };
    }
    if (year !== null) {
      return { calendarYear: year, calendarMonth: 1 };
    }
    // Fallback: today
    const now = new Date();
    return { calendarYear: now.getFullYear(), calendarMonth: now.getMonth() + 1 };
  }, [year, months]);

  const activeFilterCount =
    (year !== null ? 1 : 0) +
    (months.length > 0 ? 1 : 0) +
    (statuses.length > 0 ? 1 : 0);

  if (loading && !data) {
    return (
      <div className="hub-loading">
        <span className="loading-spinner" style={{ width: 24, height: 24 }} />
        <span>Carregando frequência...</span>
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
          {statuses.length > 0 && (
            <span className="filter-chip active">
              {statuses
                .map((s) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s)
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

      {/* Stats */}
      <div className="att-stats">
        <StatCard value={stats.confirmed} label="Presenças" variant="success" />
        <StatCard value={stats.absent} label="Faltas" variant="error" />
        <StatCard value={`${stats.overall}%`} label="Frequência" variant="gold" />
        <StatCard value={stats.total} label="Registros" variant="muted" />
      </div>

      {/* Table */}
      {allRecords.length === 0 ? (
        <div className="detail-empty-tab">
          <div style={{ fontSize: "1.5rem" }}>📅</div>
          <p>Nenhum registro de frequência neste período.</p>
        </div>
      ) : (
        <div className="att-table-wrapper">
          <table className="att-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Hora</th>
                <th>Modalidade</th>
                <th>Turma</th>
                <th>Professor</th>
                <th>Status</th>
                <th>Validado por</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {allRecords.map((r) => {
                const variant = STATUS_VARIANT[r.status] ?? "muted";
                const canValidate = r.status === "registered";
                const canMarkAbsent = r.status !== "absent" && r.status !== "absent_justified";
                const isLoading = validatingId === r.id;
                const isSynthetic = r.id.startsWith("absent_");
                return (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.time ?? "—"}</td>
                    <td>{r.modalityName}</td>
                    <td>{r.className}</td>
                    <td>{r.teacherName ?? "—"}</td>
                    <td>
                      <span className={`status-badge status-badge--${variant}`}>
                        {r.statusLabel}
                      </span>
                    </td>
                    <td className="att-table-muted">
                      {r.validatedByName ?? "—"}
                    </td>
                    <td className="att-table-actions">
                      {!isSynthetic && (
                        <>
                          {canValidate && (
                            <button
                              type="button"
                              className="att-action-btn att-action-btn--ok"
                              onClick={() => handleValidate(r.id, "confirmed")}
                              disabled={isLoading}
                              title="Validar presença"
                            >
                              ✓
                            </button>
                          )}
                          {canMarkAbsent && (
                            <button
                              type="button"
                              className="att-action-btn att-action-btn--no"
                              onClick={() => handleValidate(r.id, "absent")}
                              disabled={isLoading}
                              title="Marcar falta"
                            >
                              ⊘
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar */}
      <AttendanceCalendar
        records={calendarRecords}
        initialYear={calendarYear}
        initialMonth={calendarMonth}
      />

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
          <h4 className="filters-drawer-section-title">Status</h4>
          <ChipGroup
            options={STATUS_OPTIONS}
            selected={draftStatuses}
            onChange={setDraftStatuses}
            multi
          />
        </div>
      </FiltersDrawer>
    </div>
  );
}

function StatCard({
  value,
  label,
  variant,
}: {
  value: string | number;
  label: string;
  variant?: string;
}) {
  return (
    <div className={`classes-stat-card ${variant ? `classes-stat-card--${variant}` : ""}`}>
      <div className="classes-stat-value">{value}</div>
      <div className="classes-stat-label">{label}</div>
    </div>
  );
}
