import type { GraduationEntry } from "./types";

/**
 * Vertical graduation badge — one per modality the user is graduated in.
 *
 * Layout:
 * ```
 * ┌───┐
 * │ J │ ← label letter 1
 * │ I │ ← label letter 2
 * │ U │ ← label letter 3
 * │ ─ │ ← belt color band
 * │ ─ │ ← degree mark 1
 * │ ─ │ ← degree mark 2 (up to 4)
 * └───┘
 * ```
 */

interface GraduationBadgeProps {
  modalityId: string;
  entry: GraduationEntry;
}

const MODALITY_LABELS: Record<string, string> = {
  "jiu-jitsu": "JIU",
  "muay-thai": "MUT",
  mma: "MMA",
  capoeira: "CAP",
};

/** Map a belt color name (en or pt) to a CSS color value. */
const BELT_COLORS: Record<string, string> = {
  // Jiu-Jitsu — adult
  white: "#f5f5f5",
  branca: "#f5f5f5",
  blue: "#1e6aa8",
  azul: "#1e6aa8",
  purple: "#5e3a8a",
  roxa: "#5e3a8a",
  brown: "#6b4423",
  marrom: "#6b4423",
  black: "#1a1a1a",
  preta: "#1a1a1a",
  // Jiu-Jitsu — youth
  cinza: "#7a7a7a",
  gray: "#7a7a7a",
  amarela: "#e8c547",
  yellow: "#e8c547",
  laranja: "#e8843c",
  orange: "#e8843c",
  verde: "#3aa84a",
  green: "#3aa84a",
  // Capoeira / generic
  red: "#c84030",
  vermelha: "#c84030",
};

function beltColor(belt: string): string {
  return BELT_COLORS[belt.toLowerCase()] ?? "var(--gold)";
}

function modalityLabel(modalityId: string): string {
  return MODALITY_LABELS[modalityId] ?? modalityId.slice(0, 3).toUpperCase();
}

export function GraduationBadge({ modalityId, entry }: GraduationBadgeProps) {
  const label = modalityLabel(modalityId);
  const color = beltColor(entry.belt);
  // Cap degrees at 4 visual marks
  const degrees = Math.max(0, Math.min(4, entry.degree));
  const marks = Array.from({ length: degrees }, (_, i) => i);

  return (
    <div className="grad-badge" title={`${entry.belt} · ${entry.degree}º grau`}>
      <div className="grad-badge-label">
        {label.split("").map((ch, i) => (
          <span key={i} className="grad-badge-letter">
            {ch}
          </span>
        ))}
      </div>
      <div className="grad-badge-belt" style={{ backgroundColor: color }} />
      <div className="grad-badge-degrees">
        {marks.map((i) => (
          <span key={i} className="grad-badge-mark" />
        ))}
      </div>
    </div>
  );
}

interface GraduationBadgeColumnProps {
  graduation?: Record<string, GraduationEntry> | null;
}

const MODALITY_ORDER = ["jiu-jitsu", "muay-thai", "mma", "capoeira"];

/**
 * Column of up to 4 vertical graduation badges, one per known modality.
 * Modalities without a graduation entry are skipped (no empty badge).
 */
export function GraduationBadgeColumn({ graduation }: GraduationBadgeColumnProps) {
  if (!graduation) return null;
  const entries = MODALITY_ORDER
    .filter((mid) => graduation[mid])
    .map((mid) => [mid, graduation[mid]] as const);

  // Also include any unknown modalities (for forward compatibility)
  for (const [mid, entry] of Object.entries(graduation)) {
    if (!MODALITY_ORDER.includes(mid)) {
      entries.push([mid, entry]);
    }
  }

  if (entries.length === 0) return null;

  return (
    <div className="grad-badge-column">
      {entries.slice(0, 4).map(([mid, entry]) => (
        <GraduationBadge key={mid} modalityId={mid} entry={entry} />
      ))}
    </div>
  );
}
