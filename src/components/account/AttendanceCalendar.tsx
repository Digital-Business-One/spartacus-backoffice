import { useMemo, useState } from "react";

export interface CalendarRecord {
  /** Date in ISO short form: "2026-03-15" */
  dateSort: string;
  /** Status: registered | confirmed | absent | absent_justified */
  status: string;
}

interface AttendanceCalendarProps {
  records: CalendarRecord[];
  /** Initial year/month — typically the oldest selected month from the filters. */
  initialYear: number;
  initialMonth: number; // 1-12
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEK_HEADERS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const STATUS_VARIANTS: Record<string, string> = {
  confirmed: "success",
  registered: "warning",
  absent: "error",
  absent_justified: "muted",
};

/**
 * Read-only attendance calendar (RFC-12 D12).
 *
 * Navigable by year and month independently of the table filter.
 * Days are not interactive (no click handler) — purely a visual overview.
 * The cursor starts at the oldest selected month from the filters.
 */
export function AttendanceCalendar({
  records,
  initialYear,
  initialMonth,
}: AttendanceCalendarProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  // Index records by date for the visible month
  const recordsByDate = useMemo(() => {
    const map = new Map<string, CalendarRecord>();
    for (const r of records) {
      map.set(r.dateSort, r);
    }
    return map;
  }, [records]);

  // Compute calendar grid
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function prevYear() {
    setYear(year - 1);
  }

  function nextYear() {
    setYear(year + 1);
  }

  return (
    <div className="att-calendar">
      <div className="att-calendar-header">
        <div className="att-calendar-nav">
          <button
            type="button"
            className="att-calendar-nav-btn"
            onClick={prevYear}
            aria-label="Ano anterior"
          >
            «
          </button>
          <button
            type="button"
            className="att-calendar-nav-btn"
            onClick={prevMonth}
            aria-label="Mês anterior"
          >
            ‹
          </button>
        </div>
        <div className="att-calendar-title">
          {MONTH_NAMES[month - 1]} {year}
        </div>
        <div className="att-calendar-nav">
          <button
            type="button"
            className="att-calendar-nav-btn"
            onClick={nextMonth}
            aria-label="Próximo mês"
          >
            ›
          </button>
          <button
            type="button"
            className="att-calendar-nav-btn"
            onClick={nextYear}
            aria-label="Próximo ano"
          >
            »
          </button>
        </div>
      </div>

      <div className="att-calendar-grid">
        {WEEK_HEADERS.map((d) => (
          <div key={d} className="att-calendar-weekhead">
            {d}
          </div>
        ))}
        {grid.map((cell, i) => {
          if (cell === null) {
            return <div key={i} className="att-calendar-cell att-calendar-cell--empty" />;
          }
          const rec = recordsByDate.get(cell.dateSort);
          const variant = rec ? STATUS_VARIANTS[rec.status] ?? "" : "";
          return (
            <div
              key={i}
              className={`att-calendar-cell ${variant ? `att-calendar-cell--${variant}` : ""}`}
            >
              <span className="att-calendar-day">{cell.day}</span>
            </div>
          );
        })}
      </div>

      <div className="att-calendar-legend">
        <LegendItem variant="success" label="Validado" />
        <LegendItem variant="warning" label="Aguardando" />
        <LegendItem variant="error" label="Não confirmado" />
        <LegendItem variant="muted" label="Justificado" />
      </div>
    </div>
  );
}

function LegendItem({ variant, label }: { variant: string; label: string }) {
  return (
    <div className="att-calendar-legend-item">
      <span
        className={`att-calendar-legend-dot att-calendar-cell--${variant}`}
      />
      <span>{label}</span>
    </div>
  );
}

interface CalendarCell {
  day: number;
  dateSort: string;
}

/**
 * Build the month grid (Sun-first). Returns an array of 35 or 42 cells.
 * `null` cells are leading/trailing blanks.
 */
function buildMonthGrid(year: number, month: number): (CalendarCell | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  const startWeekday = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (CalendarCell | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      dateSort: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }
  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
