/* Calendar domain helpers (backoffice).
 * Expands recurring classes + one-off events into dated entries and applies
 * the substitution rule: an event with a time window suppresses any class
 * instance it overlaps on the same day. */

export type EntryKind = "class" | "own" | "external" | "guest_class";

export interface CalendarEntry {
  id: string;
  title: string;
  kind: EntryKind;
  date: Date; // local day (00:00)
  start: string; // "HH:MM" or ""
  end: string; // "HH:MM" or ""
  location?: string | null;
  teacher?: string | null;
  modality?: string | null;
  suppressed?: boolean; // class hidden by an overlapping event
}

export const ENTRY_COLORS: Record<EntryKind, string> = {
  class: "#2563EB", // aula (turma)
  own: "#0D9488", // evento próprio
  external: "#EA580C", // evento de terceiro
  guest_class: "#7C3AED", // aulão substituto
};

export const ENTRY_LABELS: Record<EntryKind, string> = {
  class: "Aula",
  own: "Evento próprio",
  external: "Evento de terceiro",
  guest_class: "Aulão substituto",
};

const DAY_MAP: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

export interface ClassLike {
  id: string;
  modality_name: string;
  active?: boolean;
  schedule_items: { day: string; start_time: string; end_time: string }[];
  teacher?: string | null;
  location?: string | null;
  modality_id?: string;
}

export interface EventLike {
  id: string;
  title: string;
  type: "event" | "championship";
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  eventCategory?: "own" | "external" | "guest_class" | null;
  modalityId?: string | null;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** [aStart,aEnd) intersects [bStart,bEnd) — all in minutes. */
function overlaps(
  aS: number | null, aE: number | null, bS: number | null, bE: number | null,
): boolean {
  if (aS == null || bS == null) return false;
  const ae = aE ?? aS + 60;
  const be = bE ?? bS + 60;
  return aS < be && bS < ae;
}

function eventKind(ev: EventLike): EntryKind {
  if (ev.eventCategory) return ev.eventCategory;
  return ev.type === "championship" ? "external" : "own";
}

/** Build dated entries for [from, to] (inclusive days). */
export function buildEntries(
  classes: ClassLike[],
  events: EventLike[],
  from: Date,
  to: Date,
): CalendarEntry[] {
  const entries: CalendarEntry[] = [];

  // Recurring classes → one instance per matching weekday in range
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  while (cursor <= end) {
    for (const cls of classes) {
      if (cls.active === false) continue;
      for (const item of cls.schedule_items ?? []) {
        if (DAY_MAP[item.day] === cursor.getDay()) {
          entries.push({
            id: `${cls.id}_${cursor.toISOString().slice(0, 10)}_${item.start_time}`,
            title: cls.modality_name,
            kind: "class",
            date: new Date(cursor),
            start: item.start_time,
            end: item.end_time,
            teacher: cls.teacher,
            location: cls.location,
            modality: cls.modality_id,
          });
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // One-off events
  for (const ev of events) {
    const d = new Date(ev.startDate);
    if (isNaN(d.getTime())) continue;
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day < from || day > end) continue;
    const endD = ev.endDate ? new Date(ev.endDate) : null;
    entries.push({
      id: ev.id,
      title: ev.title,
      kind: eventKind(ev),
      date: day,
      start: hhmm(d),
      end: endD && !isNaN(endD.getTime()) ? hhmm(endD) : "",
      location: ev.location,
      modality: ev.modalityId,
    });
  }

  // Substitution: events with a time window suppress overlapping classes
  const eventsWithTime = entries.filter(
    (e) => e.kind !== "class" && toMinutes(e.start) != null,
  );
  for (const cls of entries) {
    if (cls.kind !== "class") continue;
    const cs = toMinutes(cls.start);
    const ce = toMinutes(cls.end);
    for (const ev of eventsWithTime) {
      if (!sameDay(cls.date, ev.date)) continue;
      if (overlaps(cs, ce, toMinutes(ev.start), toMinutes(ev.end))) {
        cls.suppressed = true;
        break;
      }
    }
  }

  return entries.sort((a, b) => {
    const t = a.date.getTime() - b.date.getTime();
    if (t !== 0) return t;
    return (toMinutes(a.start) ?? 9999) - (toMinutes(b.start) ?? 9999);
  });
}

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

/** Visible entries (suppressed classes removed). */
export function visibleEntries(entries: CalendarEntry[]): CalendarEntry[] {
  return entries.filter((e) => !e.suppressed);
}

/* ── Range helpers ──────────────────────────────────────────────────────── */

export function startOfWeek(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() - r.getDay()); // week starts Sunday
  return r;
}

export function monthGridRange(year: number, month: number): [Date, Date] {
  const first = new Date(year, month, 1);
  const start = startOfWeek(first);
  const end = new Date(start);
  end.setDate(start.getDate() + 41); // 6 weeks
  return [start, end];
}

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function monthsInRange(from: Date, to: Date): string[] {
  const set = new Set<string>();
  const c = new Date(from.getFullYear(), from.getMonth(), 1);
  while (c <= to) {
    set.add(`${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, "0")}`);
    c.setMonth(c.getMonth() + 1);
  }
  return [...set];
}
