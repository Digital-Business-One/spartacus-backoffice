import { useId } from "react";
import type { GraduationEntry } from "./types";

/**
 * Graduation badge — vertical bookmark-style belt ribbon (prototype visual).
 *
 * SVG ribbon 18×104: flat top anchored flush to the card's top border,
 * chevron-cut pointed bottom, drop shadow, shine on the upper half, center
 * fold line, grau tick marks near the tip and vertical modality initials.
 *
 *   ┌──┐  ← flush with card top border
 *   │ J│
 *   │ I│  ← vertical initials
 *   │ U│
 *   │──│  ← center fold line
 *   │██│  ← belt color fills body (gradient when composite belt)
 *   │━━│  ← grau tick marks
 *   ╲╱   ← chevron tip
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

const BELT_COLORS: Record<string, string> = {
  // Jiu-Jitsu — adult
  white: "#f2f2f2",
  branca: "#f2f2f2",
  blue: "#1f4fa0",
  azul: "#1f4fa0",
  purple: "#5a2c89",
  roxa: "#5a2c89",
  brown: "#5a3515",
  marrom: "#5a3515",
  black: "#111111",
  preta: "#111111",
  // Jiu-Jitsu — youth / kids
  cinza: "#a8a8a8",
  gray: "#a8a8a8",
  amarela: "#f0c83b",
  yellow: "#f0c83b",
  laranja: "#ea8226",
  orange: "#ea8226",
  verde: "#2ea247",
  green: "#2ea247",
  // Capoeira / generic
  red: "#b83228",
  vermelha: "#b83228",
  crua: "#dac6a5",
  bege: "#dac6a5",
};

const FALLBACK_COLOR = "#bcbcbc";

const LIGHT_BELTS = new Set([
  "white", "branca",
  "yellow", "amarela",
  "crua", "bege",
  "cinza", "gray",
]);

function resolveBelt(belt: string): {
  primary: string;
  secondary: string | null;
  darkText: boolean;
} {
  const key = (belt ?? "").trim().toLowerCase();
  if (!key) return { primary: FALLBACK_COLOR, secondary: null, darkText: true };

  if (key.includes("-") || key.includes("/") || key.includes(" e ")) {
    const parts = key.split(/[-/]|\s+e\s+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const a = BELT_COLORS[parts[0]];
      const b = BELT_COLORS[parts[1]];
      if (a && b) {
        return {
          primary: a,
          secondary: b,
          darkText: LIGHT_BELTS.has(parts[0]),
        };
      }
    }
  }

  return {
    primary: BELT_COLORS[key] ?? FALLBACK_COLOR,
    secondary: null,
    darkText: LIGHT_BELTS.has(key) || !BELT_COLORS[key],
  };
}

function modalityLabel(modalityId: string): string {
  return MODALITY_LABELS[modalityId] ?? modalityId.slice(0, 3).toUpperCase();
}

export function GraduationBadge({ modalityId, entry }: GraduationBadgeProps) {
  const uid = useId();
  const label = modalityLabel(modalityId);
  const { primary, secondary, darkText } = resolveBelt(entry.belt);
  const degrees = Math.max(0, Math.min(4, entry.degree));
  const stripeCol = darkText ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.75)";
  const letterCol = darkText ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.55)";
  const pending = entry.status === "pending";
  const rejected = entry.status === "rejected";
  const beltTitle =
    (entry.belt
      ? `${entry.belt}${entry.degree > 0 ? ` · ${entry.degree}º grau` : ""}`
      : "Sem graduação") +
    (pending ? " · aguardando aprovação" : rejected ? " · reprovada" : "");

  const shadowId = `grad-shadow-${uid}`;
  const fillId = `grad-fill-${uid}`;

  return (
    <div
      className={`grad-badge${pending ? " grad-badge--pending" : ""}${rejected ? " grad-badge--rejected" : ""}`}
      title={beltTitle}
    >
      <svg width="18" height="104" viewBox="0 0 18 104" className="grad-badge-svg">
        <defs>
          <filter id={shadowId}>
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.4" />
          </filter>
          {secondary && (
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primary} />
              <stop offset="50%" stopColor={primary} />
              <stop offset="50%" stopColor={secondary} />
              <stop offset="100%" stopColor={secondary} />
            </linearGradient>
          )}
        </defs>
        {/* Belt body: flat top, chevron-cut bottom */}
        <path
          d="M0 0 L18 0 L18 96 L9 104 L0 96 Z"
          fill={secondary ? `url(#${fillId})` : primary}
          filter={`url(#${shadowId})`}
        />
        {/* Subtle shine overlay (upper half) */}
        <path d="M0 0 L18 0 L18 52 L0 52 Z" fill="rgba(255,255,255,0.06)" />
        {/* Center fold line */}
        <line x1="0" y1="52" x2="18" y2="52" stroke={stripeCol} strokeWidth="0.7" opacity="0.3" />
        {/* Grau tick marks near the pointed end */}
        {Array.from({ length: degrees }).map((_, i) => (
          <line
            key={i}
            x1="3" y1={80 + i * 4} x2="15" y2={80 + i * 4}
            stroke={stripeCol} strokeWidth="1.5" strokeLinecap="round"
          />
        ))}
      </svg>
      {/* Modality initials — vertical text inside ribbon */}
      <span className="grad-badge-label" style={{ color: letterCol }}>
        {label}
      </span>
    </div>
  );
}

interface GraduationBadgeColumnProps {
  graduation?: Record<string, GraduationEntry> | null;
}

const MODALITY_ORDER = ["jiu-jitsu", "muay-thai", "mma", "capoeira"];

export function GraduationBadgeColumn({ graduation }: GraduationBadgeColumnProps) {
  if (!graduation) return null;
  const entries = MODALITY_ORDER
    .filter((mid) => graduation[mid])
    .map((mid) => [mid, graduation[mid]] as const);

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
