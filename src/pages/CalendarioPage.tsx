import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useClasses } from "../hooks/useClasses";
import {
  buildEntries,
  visibleEntries,
  monthGridRange,
  startOfWeek,
  monthsInRange,
  MONTH_NAMES,
  WEEKDAY_SHORT,
  ENTRY_COLORS,
  ENTRY_LABELS,
  type CalendarEntry,
  type EntryKind,
  type EventLike,
} from "../lib/calendar";
import { EventWizardDrawer } from "../components/calendar/EventWizardDrawer";

const PROJECT_ID =
  import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "spartacus-artes-marciais";

type View = "month" | "week" | "day";
type Display = "grid" | "list";

const Svg = ({ children, size = 16 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcPrev = () => (<Svg><polyline points="15 18 9 12 15 6" /></Svg>);
const IcNext = () => (<Svg><polyline points="9 18 15 12 9 6" /></Svg>);
const IcPlus = () => (<Svg><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Svg>);

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarioPage() {
  const today = useMemo(() => new Date(), []);
  const { classes } = useClasses();
  const [view, setView] = useState<View>("month");
  const [display, setDisplay] = useState<Display>("grid");
  const [anchor, setAnchor] = useState<Date>(today);
  const [events, setEvents] = useState<EventLike[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Visible range by view
  const [rangeStart, rangeEnd] = useMemo<[Date, Date]>(() => {
    if (view === "month") return monthGridRange(anchor.getFullYear(), anchor.getMonth());
    if (view === "week") {
      const s = startOfWeek(anchor);
      const e = new Date(s); e.setDate(s.getDate() + 6);
      return [s, e];
    }
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    return [d, d];
  }, [view, anchor]);

  const fetchEvents = useCallback(async () => {
    const months = monthsInRange(rangeStart, rangeEnd);
    try {
      const lists = await Promise.all(
        months.map((m) =>
          api
            .get<{ events: EventLike[] }>(
              `/projects/${PROJECT_ID}/events?month=${m}`,
            )
            .then((r) => r.events)
            .catch(() => [] as EventLike[]),
        ),
      );
      const seen = new Set<string>();
      const merged: EventLike[] = [];
      for (const ev of lists.flat()) {
        if (!seen.has(ev.id)) { seen.add(ev.id); merged.push(ev); }
      }
      setEvents(merged);
    } catch {
      setEvents([]);
    }
  }, [rangeStart, rangeEnd]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const allEntries = useMemo(
    () => buildEntries(classes, events, rangeStart, rangeEnd),
    [classes, events, rangeStart, rangeEnd],
  );
  const entries = useMemo(() => visibleEntries(allEntries), [allEntries]);

  // Navigation by active granularity
  const step = (dir: 1 | -1) => {
    setAnchor((prev) => {
      const n = new Date(prev);
      if (view === "month") n.setMonth(n.getMonth() + dir);
      else if (view === "week") n.setDate(n.getDate() + 7 * dir);
      else n.setDate(n.getDate() + dir);
      return n;
    });
  };

  const periodLabel = useMemo(() => {
    if (view === "month") return `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
    if (view === "day")
      return `${anchor.getDate()} de ${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
    const s = startOfWeek(anchor);
    const e = new Date(s); e.setDate(s.getDate() + 6);
    return `${s.getDate()}/${s.getMonth() + 1} – ${e.getDate()}/${e.getMonth() + 1} ${e.getFullYear()}`;
  }, [view, anchor]);

  return (
    <div className="cal-page">
      <div className="cal-header">
        <div>
          <h2 className="settings-title">CALENDÁRIO</h2>
          <p>Aulas e eventos do projeto</p>
        </div>
        <button className="cal-new-btn" onClick={() => setDrawerOpen(true)}>
          <IcPlus /> Evento
        </button>
      </div>

      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="cal-icon-btn" onClick={() => step(-1)} aria-label="Anterior"><IcPrev /></button>
          <span className="cal-period">{periodLabel}</span>
          <button className="cal-icon-btn" onClick={() => step(1)} aria-label="Próximo"><IcNext /></button>
          <button className="cal-today-btn" onClick={() => setAnchor(new Date())}>Hoje</button>
        </div>
        <div className="cal-switches">
          <div className="cal-seg">
            {(["month", "week", "day"] as View[]).map((v) => (
              <button key={v} className={`cal-seg-btn ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
                {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
              </button>
            ))}
          </div>
          <div className="cal-seg">
            {(["grid", "list"] as Display[]).map((d) => (
              <button key={d} className={`cal-seg-btn ${display === d ? "active" : ""}`} onClick={() => setDisplay(d)}>
                {d === "grid" ? "Grade" : "Lista"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="cal-legend">
        {(Object.keys(ENTRY_COLORS) as EntryKind[]).map((k) => (
          <span key={k} className="cal-legend-item">
            <span className="cal-legend-dot" style={{ background: ENTRY_COLORS[k] }} />
            {ENTRY_LABELS[k]}
          </span>
        ))}
      </div>

      {display === "list" ? (
        <AgendaList entries={entries} />
      ) : view === "month" ? (
        <MonthGrid
          year={anchor.getFullYear()}
          month={anchor.getMonth()}
          today={today}
          entries={entries}
          onDayClick={(d) => { setAnchor(d); setView("day"); }}
        />
      ) : view === "week" ? (
        <WeekGrid start={startOfWeek(anchor)} today={today} entries={entries}
          onDayClick={(d) => { setAnchor(d); setView("day"); }} />
      ) : (
        <DayGrid date={anchor} entries={entries} />
      )}

      {drawerOpen && (
        <EventWizardDrawer
          projectId={PROJECT_ID}
          onClose={() => setDrawerOpen(false)}
          onCreated={() => { setDrawerOpen(false); fetchEvents(); }}
        />
      )}
    </div>
  );
}

/* ── Chip ───────────────────────────────────────────────────────────────── */

function Chip({ e }: { e: CalendarEntry }) {
  return (
    <span className="cal-chip" style={{ background: ENTRY_COLORS[e.kind] }} title={`${e.start ? e.start + " " : ""}${e.title}`}>
      {e.start ? `${e.start} ` : ""}{e.title}
    </span>
  );
}

/* ── Month grid ─────────────────────────────────────────────────────────── */

function MonthGrid({
  year, month, today, entries, onDayClick,
}: {
  year: number; month: number; today: Date; entries: CalendarEntry[];
  onDayClick: (d: Date) => void;
}) {
  const [start] = monthGridRange(year, month);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); days.push(d);
  }
  return (
    <div className="cal-month">
      <div className="cal-month-head">
        {WEEKDAY_SHORT.map((w) => <div key={w} className="cal-month-weekday">{w}</div>)}
      </div>
      <div className="cal-month-grid">
        {days.map((d) => {
          const dayEntries = entries.filter((e) => isSameDay(e.date, d));
          const dim = d.getMonth() !== month;
          return (
            <button key={d.toISOString()} className={`cal-cell ${dim ? "cal-cell--dim" : ""} ${isSameDay(d, today) ? "cal-cell--today" : ""}`}
              onClick={() => onDayClick(d)}>
              <span className="cal-cell-num">{d.getDate()}</span>
              <div className="cal-cell-events">
                {dayEntries.slice(0, 3).map((e) => <Chip key={e.id} e={e} />)}
                {dayEntries.length > 3 && <span className="cal-more">+{dayEntries.length - 3}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Week grid ──────────────────────────────────────────────────────────── */

function WeekGrid({
  start, today, entries, onDayClick,
}: {
  start: Date; today: Date; entries: CalendarEntry[]; onDayClick: (d: Date) => void;
}) {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
  return (
    <div className="cal-week">
      {days.map((d) => {
        const dayEntries = entries.filter((e) => isSameDay(e.date, d));
        return (
          <div key={d.toISOString()} className={`cal-week-col ${isSameDay(d, today) ? "cal-week-col--today" : ""}`}>
            <button className="cal-week-colhead" onClick={() => onDayClick(d)}>
              <span>{WEEKDAY_SHORT[d.getDay()]}</span>
              <strong>{d.getDate()}</strong>
            </button>
            <div className="cal-week-body">
              {dayEntries.length === 0 ? <span className="cal-empty-min">—</span> :
                dayEntries.map((e) => <Chip key={e.id} e={e} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Day grid ───────────────────────────────────────────────────────────── */

function DayGrid({ date, entries }: { date: Date; entries: CalendarEntry[] }) {
  const dayEntries = entries.filter((e) => isSameDay(e.date, date));
  if (dayEntries.length === 0) {
    return <div className="empty-state" style={{ marginTop: "1.5rem" }}><div className="empty-state-icon">📅</div><h3>Nada neste dia</h3></div>;
  }
  return (
    <div className="cal-day">
      {dayEntries.map((e) => (
        <div key={e.id} className="cal-day-row" style={{ borderLeftColor: ENTRY_COLORS[e.kind] }}>
          <div className="cal-day-time">{e.start || "—"}{e.end ? `–${e.end}` : ""}</div>
          <div className="cal-day-body">
            <span className="cal-day-title">{e.title}</span>
            <span className="cal-day-meta">
              {ENTRY_LABELS[e.kind]}{e.location ? ` · ${e.location}` : ""}{e.teacher ? ` · ${e.teacher}` : ""}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Agenda list ────────────────────────────────────────────────────────── */

function AgendaList({ entries }: { entries: CalendarEntry[] }) {
  if (entries.length === 0) {
    return <div className="empty-state" style={{ marginTop: "1.5rem" }}><div className="empty-state-icon">📅</div><h3>Sem itens no período</h3></div>;
  }
  // group by day
  const groups: { day: Date; items: CalendarEntry[] }[] = [];
  for (const e of entries) {
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.day, e.date)) last.items.push(e);
    else groups.push({ day: e.date, items: [e] });
  }
  return (
    <div className="cal-agenda">
      {groups.map((g) => (
        <div key={g.day.toISOString()} className="cal-agenda-group">
          <div className="cal-agenda-date">
            {WEEKDAY_SHORT[g.day.getDay()]} {g.day.getDate()}/{g.day.getMonth() + 1}
          </div>
          <div className="cal-agenda-items">
            {g.items.map((e) => (
              <div key={e.id} className="cal-agenda-row" style={{ borderLeftColor: ENTRY_COLORS[e.kind] }}>
                <span className="cal-agenda-time">{e.start || "—"}</span>
                <span className="cal-agenda-title">{e.title}</span>
                <span className="cal-agenda-kind">{ENTRY_LABELS[e.kind]}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
