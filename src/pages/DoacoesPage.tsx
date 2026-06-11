import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { GraduationBadgeColumn } from "../components/account/GraduationBadge";
import type { GraduationEntry } from "../components/account/types";

/* ── Types ──────────────────────────────────────────────────────────────── */

type DonationStatus = "none" | "pledged" | "received";

interface StudentCard {
  userId: string;
  name: string;
  initials: string;
  age?: number | null;
  photoUrl?: string | null;
  isDependent: boolean;
  guardianUid?: string | null;
  guardianName?: string | null;
  graduation?: Record<string, GraduationEntry> | null;
  status: DonationStatus;
  donationId?: string | null;
  item?: string | null;
  itemLabel?: string | null;
  itemDescription?: string | null;
}

interface DashboardResponse {
  month: string;
  monthLabel: string;
  students: StudentCard[];
}

/* ── Donation items (mirror of backend DonationItem) ────────────────────── */

const DONATION_ITEMS: { code: string; label: string }[] = [
  { code: "food_1kg", label: "1 KG de alimento não perecível" },
  { code: "cookies", label: "1 pacote de bolacha" },
  { code: "coffee", label: "1 pacote de café" },
  { code: "juice", label: "1 pacote de suco" },
  { code: "other", label: "Outra forma de apoio" },
];

/* ── Date helper ────────────────────────────────────────────────────────── */

const MONTH_NAMES_PT: Record<number, string> = {
  0: "janeiro", 1: "fevereiro", 2: "março", 3: "abril",
  4: "maio", 5: "junho", 6: "julho", 7: "agosto",
  8: "setembro", 9: "outubro", 10: "novembro", 11: "dezembro",
};

function formatTodayPt(d: Date): string {
  return `${d.getDate()} de ${MONTH_NAMES_PT[d.getMonth()]} de ${d.getFullYear()}`;
}

/* ── Icons ──────────────────────────────────────────────────────────────── */

const Svg = ({ children, size = 14 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const IcGift = () => (
  <Svg>
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
  </Svg>
);
const IcClock = () => (
  <Svg><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Svg>
);
const IcCheckCircle = () => (
  <Svg>
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </Svg>
);
const IcXCircle = () => (
  <Svg>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </Svg>
);
const IcCheck = () => (
  <Svg><polyline points="20 6 9 17 4 12" /></Svg>
);
const IcPlus = () => (
  <Svg><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Svg>
);

/* ── Page ───────────────────────────────────────────────────────────────── */

export function DoacoesPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(), []);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await api.get<DashboardResponse>("/donations/dashboard");
      setDashboard(data);
    } catch (err) {
      console.error("[DoacoesPage] dashboard fetch failed:", err);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Close item picker on outside click
  useEffect(() => {
    if (!pickerFor) return;
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerFor(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [pickerFor]);

  // Coluna 1 → 3: staff registra doação já aprovada
  const handleRegister = useCallback(
    async (userId: string, item: string) => {
      let itemDescription: string | null = null;
      if (item === "other") {
        itemDescription = window.prompt("Descreva a forma de apoio:");
        if (!itemDescription) return;
      }
      setPickerFor(null);
      setActingOn(userId);
      try {
        await api.post("/donations/register-received", {
          userId,
          item,
          itemDescription,
        });
        await fetchDashboard();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha ao registrar doação.";
        window.alert(msg);
      } finally {
        setActingOn(null);
      }
    },
    [fetchDashboard],
  );

  // Coluna 2: aprovar / desaprovar
  const handleValidate = useCallback(
    async (s: StudentCard, status: "received" | "absent") => {
      if (!s.donationId) return;
      setActingOn(s.userId);
      try {
        await api.patch(`/donations/${encodeURIComponent(s.donationId)}/validate`, {
          status,
        });
        await fetchDashboard();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha ao processar a ação.";
        window.alert(msg);
      } finally {
        setActingOn(null);
      }
    },
    [fetchDashboard],
  );

  const students = dashboard?.students ?? [];
  const colNone = students.filter((s) => s.status === "none");
  const colPledged = students.filter((s) => s.status === "pledged");
  const colReceived = students.filter((s) => s.status === "received");

  return (
    <div className="freq-fullwidth">
      <div className="freq-header">
        <div>
          <h2 className="settings-title">DOAÇÕES</h2>
          <p>Registro e aprovação das doações do mês</p>
        </div>
        <div className="freq-date">
          <span className="freq-date-label">{dashboard?.monthLabel ?? ""}</span>
          <span className="freq-date-value">{formatTodayPt(today)}</span>
        </div>
      </div>

      <div className="freq-kanban">
        <Column
          label="Sem doação"
          tone="muted"
          icon={<IcGift />}
          cards={colNone}
          loading={loading}
          renderActions={(s) => (
            <div className="don-register-wrap" ref={pickerFor === s.userId ? pickerRef : undefined}>
              <button
                className="freq-card-btn freq-card-btn--primary"
                onClick={() => setPickerFor(pickerFor === s.userId ? null : s.userId)}
                disabled={actingOn === s.userId}
              >
                <IcPlus />
                <span>Registrar</span>
              </button>
              {pickerFor === s.userId && (
                <div className="don-item-picker">
                  {DONATION_ITEMS.map((it) => (
                    <button
                      key={it.code}
                      className="don-item-option"
                      onClick={() => handleRegister(s.userId, it.code)}
                    >
                      {it.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        />
        <Column
          label="Aguardando aprovação"
          tone="gold"
          icon={<IcClock />}
          cards={colPledged}
          loading={loading}
          renderActions={(s) => (
            <>
              <button
                className="freq-card-btn freq-card-btn--success"
                onClick={() => handleValidate(s, "received")}
                disabled={actingOn === s.userId}
              >
                <IcCheckCircle />
                <span>Aprovar</span>
              </button>
              <button
                className="freq-card-btn freq-card-btn--danger"
                onClick={() => handleValidate(s, "absent")}
                disabled={actingOn === s.userId}
              >
                <IcXCircle />
                <span>Rejeitar</span>
              </button>
            </>
          )}
        />
        <Column
          label="Doação confirmada"
          tone="success"
          icon={<IcCheckCircle />}
          cards={colReceived}
          loading={loading}
          renderActions={() => (
            <span className="freq-card-check">
              <IcCheck />
            </span>
          )}
        />
      </div>
    </div>
  );
}

/* ── Column — adultos planos, menores agrupados sob o responsável ───────── */

interface ColumnProps {
  label: string;
  tone: "muted" | "gold" | "success";
  icon: React.ReactNode;
  cards: StudentCard[];
  renderActions: (s: StudentCard) => React.ReactNode;
  loading: boolean;
}

function Column({ label, tone, icon, cards, renderActions, loading }: ColumnProps) {
  // Hierarquia: adultos primeiro; dependentes agrupados por responsável
  const adults = cards.filter((s) => !s.isDependent);
  const familyMap = new Map<string, { guardianName: string; deps: StudentCard[] }>();
  for (const s of cards) {
    if (!s.isDependent) continue;
    const key = s.guardianUid ?? "?";
    const group = familyMap.get(key) ?? {
      guardianName: s.guardianName ?? "Responsável",
      deps: [],
    };
    group.deps.push(s);
    familyMap.set(key, group);
  }
  const families = [...familyMap.entries()].sort((a, b) =>
    a[1].guardianName.localeCompare(b[1].guardianName),
  );

  return (
    <div className={`freq-col freq-col--${tone}`}>
      <div className="freq-col-header">
        <span className="freq-col-icon">{icon}</span>
        <span className="freq-col-label">{label}</span>
        <span className="freq-col-count">{cards.length}</span>
      </div>
      <div className="freq-col-body">
        {loading ? (
          <div className="hub-loading-inline" style={{ padding: "2rem 0" }}>
            <span className="loading-spinner" />
          </div>
        ) : cards.length === 0 ? (
          <div className="freq-col-empty">
            <p>Nenhum aluno</p>
          </div>
        ) : (
          <>
            {adults.map((s) => (
              <PersonCard key={s.userId} student={s}>
                {renderActions(s)}
              </PersonCard>
            ))}
            {families.map(([gid, fam]) => (
              <div key={gid} className="don-family-group">
                <div className="don-family-label">
                  resp. <strong>{fam.guardianName}</strong>
                </div>
                {fam.deps.map((s) => (
                  <PersonCard key={s.userId} student={s}>
                    {renderActions(s)}
                  </PersonCard>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Person card ────────────────────────────────────────────────────────── */

function PersonCard({
  student,
  children,
}: {
  student: StudentCard;
  children: React.ReactNode;
}) {
  return (
    <div className="freq-card">
      <div className="freq-card-avatar">
        {student.photoUrl ? (
          <img src={student.photoUrl} alt={student.name} />
        ) : (
          <span>{student.initials}</span>
        )}
      </div>
      <div className="freq-card-body">
        <div className="freq-card-name-line">
          <span className="freq-card-name">{student.name}</span>
        </div>
        <div className="freq-card-meta">
          {student.age != null && <span>{student.age} anos</span>}
          {student.itemLabel && (
            <>
              {student.age != null && <span>·</span>}
              <span>
                {student.itemLabel}
                {student.itemDescription ? `: ${student.itemDescription}` : ""}
              </span>
            </>
          )}
        </div>
      </div>
      <GraduationBadgeColumn graduation={student.graduation} />
      <div className="freq-card-actions">{children}</div>
    </div>
  );
}
