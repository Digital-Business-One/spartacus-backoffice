import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useClasses, type ClassData } from "../hooks/useClasses";

/* ── Types ──────────────────────────────────────────────────────────────── */

type AttendanceStatus = "absent" | "registered" | "confirmed";

interface StudentCard {
  userId: string;
  name: string;
  initials: string;
  age?: number | null;
  ageCategory?: string | null;
  photoUrl?: string | null;
  roles: string[];
  isDependent: boolean;
  guardianName?: string | null;
  status: AttendanceStatus;
  source?: string | null;
}

interface ClassBrief {
  id: string;
  name: string;
  modalityId: string;
  modalityName: string;
  teacherName?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  totalSlots: number;
  enrolledCount: number;
}

interface DashboardResponse {
  class: ClassBrief;
  aulaId: string | null;
  date: string;
  students: StudentCard[];
}

/* ── Modality colors ────────────────────────────────────────────────────── */

const MODALITY_COLORS: Record<string, string> = {
  "jiu-jitsu": "#3B82F6",
  "muay-thai": "#F97316",
  capoeira: "#4CAF50",
  mma: "#EF4444",
};

function modalityColor(modalityId?: string, modalityName?: string): string {
  const k = (modalityId ?? "").toLowerCase();
  if (MODALITY_COLORS[k]) return MODALITY_COLORS[k];
  const n = (modalityName ?? "").toLowerCase();
  if (n.includes("jiu")) return MODALITY_COLORS["jiu-jitsu"];
  if (n.includes("muay")) return MODALITY_COLORS["muay-thai"];
  if (n.includes("capoeira")) return MODALITY_COLORS.capoeira;
  if (n.includes("mma")) return MODALITY_COLORS.mma;
  return "#C6A34E";
}

/* ── Day helpers ────────────────────────────────────────────────────────── */

const DAY_CODES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_LABEL_FULL: Record<number, string> = {
  0: "Domingo", 1: "Segunda-feira", 2: "Terça-feira", 3: "Quarta-feira",
  4: "Quinta-feira", 5: "Sexta-feira", 6: "Sábado",
};
const MONTH_NAMES_PT: Record<number, string> = {
  0: "janeiro", 1: "fevereiro", 2: "março", 3: "abril",
  4: "maio", 5: "junho", 6: "julho", 7: "agosto",
  8: "setembro", 9: "outubro", 10: "novembro", 11: "dezembro",
};

function formatTodayPt(d: Date): string {
  return `${d.getDate()} de ${MONTH_NAMES_PT[d.getMonth()]} de ${d.getFullYear()} · ${DAY_LABEL_FULL[d.getDay()]}`;
}

function classRunsToday(cls: ClassData, weekday: number): boolean {
  const code = DAY_CODES[weekday];
  return (cls.schedule_items ?? []).some((s) => s.day === code);
}

function classTimeForToday(cls: ClassData, weekday: number): string | null {
  const code = DAY_CODES[weekday];
  const item = (cls.schedule_items ?? []).find((s) => s.day === code);
  if (!item) return null;
  return `${item.start_time}–${item.end_time}`;
}

/* ── Icons ──────────────────────────────────────────────────────────────── */

const Svg = ({ children, size = 14 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const IcUserX = () => (
  <Svg>
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="18" y1="8" x2="23" y2="13" />
    <line x1="23" y1="8" x2="18" y2="13" />
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
const IcUserCheck = () => (
  <Svg>
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </Svg>
);
const IcXCircle = () => (
  <Svg>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </Svg>
);
const IcChevronDown = () => (
  <Svg><polyline points="6 9 12 15 18 9" /></Svg>
);
const IcCheck = () => (
  <Svg><polyline points="20 6 9 17 4 12" /></Svg>
);

/* ── Page ───────────────────────────────────────────────────────────────── */

export function FrequenciaPage() {
  const { classes, loading: classesLoading } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(), []);
  const weekday = today.getDay();

  // Split active classes into today's and others
  const allActive = useMemo(
    () => (classes ?? []).filter((c) => c.active !== false),
    [classes],
  );
  const todayClasses = useMemo(
    () => allActive.filter((c) => classRunsToday(c, weekday)),
    [allActive, weekday],
  );
  const otherClasses = useMemo(
    () => allActive.filter((c) => !classRunsToday(c, weekday)),
    [allActive, weekday],
  );
  const activeClasses = todayClasses; // main list for empty-state check
  const [showAllClasses, setShowAllClasses] = useState(false);

  // Auto-pick a class when list arrives
  useEffect(() => {
    if (!selectedClassId && todayClasses.length > 0) {
      setSelectedClassId(todayClasses[0].id);
    }
  }, [todayClasses, selectedClassId]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const h = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [dropdownOpen]);

  // Fetch dashboard when class changes
  const fetchDashboard = useCallback(async (classId: string) => {
    setLoading(true);
    try {
      const data = await api.get<DashboardResponse>(
        `/attendance/dashboard/${encodeURIComponent(classId)}`,
      );
      setDashboard(data);
    } catch (err) {
      console.error("[FrequenciaPage] dashboard fetch failed:", err);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) fetchDashboard(selectedClassId);
  }, [selectedClassId, fetchDashboard]);

  const handleAction = useCallback(
    async (
      action: "confirm" | "reject",
      userId: string,
    ) => {
      if (!selectedClassId || !dashboard) return;
      setActingOn(userId);

      async function send(force: boolean) {
        await api.post(`/attendance/${action}`, {
          classId: selectedClassId,
          userId,
          aulaId: dashboard?.aulaId,
          source: "manual",
          force,
        });
      }

      try {
        await send(false);
        await fetchDashboard(selectedClassId);
      } catch (err) {
        const isNoSchedule =
          err instanceof ApiError &&
          err.status === 400 &&
          typeof err.message === "string" &&
          err.message.includes("Sem aula agendada");
        if (isNoSchedule) {
          const verb = action === "confirm" ? "registrar" : "rejeitar";
          const ok = window.confirm(
            `Esta turma não tem aula agendada para hoje. ` +
            `Deseja ${verb} a presença retroativamente?`,
          );
          if (!ok) return;
          try {
            await send(true);
            await fetchDashboard(selectedClassId);
          } catch (retryErr) {
            const msg =
              retryErr instanceof Error
                ? retryErr.message
                : "Falha ao registrar presença retroativa.";
            window.alert(msg);
          }
        } else {
          const msg =
            err instanceof Error
              ? err.message
              : "Falha ao processar a ação.";
          window.alert(msg);
        }
      } finally {
        setActingOn(null);
      }
    },
    [selectedClassId, dashboard, fetchDashboard],
  );

  const selectedClass =
    allActive.find((c) => c.id === selectedClassId);
  const selectedIsToday = selectedClass
    ? classRunsToday(selectedClass, weekday)
    : true;
  const color = selectedClass
    ? modalityColor(selectedClass.modality_id, selectedClass.modality_name)
    : "#C6A34E";

  function renderDropdownOption(t: ClassData, dimmed: boolean) {
    const c = modalityColor(t.modality_id, t.modality_name);
    const isSel = t.id === selectedClassId;
    return (
      <button
        key={t.id}
        className={`freq-turma-option ${isSel ? "active" : ""} ${dimmed ? "freq-turma-option--dimmed" : ""}`}
        onClick={() => {
          setSelectedClassId(t.id);
          setDropdownOpen(false);
        }}
        style={isSel ? { background: `${c}12` } : undefined}
      >
        <span
          className="freq-turma-option-dot"
          style={{ background: c, opacity: dimmed ? 0.4 : 1 }}
        />
        <div className="freq-turma-option-body">
          <div>
            <span
              className="freq-turma-modality"
              style={{ color: dimmed ? `${c}88` : c }}
            >
              {t.modality_name?.toUpperCase()}
            </span>
            <span className={`freq-turma-name ${dimmed ? "freq-turma-name--dimmed" : ""}`}>
              {t.name}
            </span>
          </div>
          <p className="freq-turma-option-meta">
            {t.schedule ?? "—"}
            {t.teacher ? ` · Prof. ${t.teacher}` : ""}
          </p>
        </div>
        {isSel && <IcCheck />}
      </button>
    );
  }

  const students = dashboard?.students ?? [];
  const colAbsent = students.filter((s) => s.status === "absent");
  const colRegistered = students.filter((s) => s.status === "registered");
  const colConfirmed = students.filter((s) => s.status === "confirmed");

  return (
    <div className="freq-fullwidth">
      <div className="freq-header">
        <div>
          <h2 className="settings-title">FREQUÊNCIA</h2>
          <p>Registro e confirmação de presença</p>
        </div>
        <div className="freq-date">
          <span className="freq-date-label">Hoje</span>
          <span className="freq-date-value">{formatTodayPt(today)}</span>
        </div>
      </div>

      {/* Turma selector */}
      {classesLoading ? (
        <div className="hub-loading" style={{ padding: "1rem 0" }}>
          <span className="loading-spinner" style={{ width: 20, height: 20 }} />
          <span>Carregando turmas...</span>
        </div>
      ) : activeClasses.length === 0 ? (
        <div className="empty-state" style={{ marginTop: "1.5rem" }}>
          <div className="empty-state-icon">📅</div>
          <h3>Nenhuma aula hoje</h3>
          <p>Nenhuma turma ativa tem agenda para hoje.</p>
        </div>
      ) : (
        <>
          <div
            ref={dropdownRef}
            className="freq-turma-selector"
            style={{ position: "relative" }}
          >
            <button
              className="freq-turma-btn"
              onClick={() => setDropdownOpen((v) => !v)}
              style={{
                borderColor: dropdownOpen ? `${color}60` : undefined,
                background: dropdownOpen
                  ? `linear-gradient(135deg, ${color}12, rgba(255,255,255,0.03))`
                  : undefined,
              }}
            >
              {selectedClass ? (
                <>
                  <span
                    className="freq-turma-accent"
                    style={{ background: color }}
                  />
                  <div className="freq-turma-label">
                    <span
                      className="freq-turma-modality"
                      style={{ color }}
                    >
                      {selectedClass.modality_name?.toUpperCase()}
                    </span>
                    <span className="freq-turma-name">
                      {selectedClass.name}
                    </span>
                  </div>
                  <div className="freq-turma-divider" />
                  <div className="freq-turma-meta">
                    <span className="freq-turma-time">
                      {classTimeForToday(selectedClass, weekday) ?? "—"}
                    </span>
                    {selectedClass.teacher && (
                      <span className="freq-turma-teacher">
                        Prof. {selectedClass.teacher}
                      </span>
                    )}
                  </div>
                  <div className="freq-turma-stats">
                    <div>
                      <span className="freq-turma-stat-value">
                        {dashboard?.class.enrolledCount ?? "—"}
                      </span>
                      <span className="freq-turma-stat-label">matriculados</span>
                    </div>
                  </div>
                  <span className={`freq-turma-chevron ${dropdownOpen ? "open" : ""}`}>
                    <IcChevronDown />
                  </span>
                </>
              ) : (
                <span>Selecione uma turma</span>
              )}
            </button>

            {dropdownOpen && (
              <div className="freq-turma-dropdown">
                {todayClasses.map((t) => renderDropdownOption(t, false))}

                {otherClasses.length > 0 && (
                  <>
                    <button
                      type="button"
                      className="freq-turma-show-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllClasses((v) => !v);
                      }}
                    >
                      <span className="freq-turma-show-all-line" />
                      <span className="freq-turma-show-all-label">
                        {showAllClasses
                          ? "Ocultar outras turmas"
                          : `Ver todas as turmas (${otherClasses.length})`}
                      </span>
                      <span className="freq-turma-show-all-line" />
                    </button>

                    {showAllClasses &&
                      otherClasses.map((t) => renderDropdownOption(t, true))}
                  </>
                )}
              </div>
            )}
          </div>

          {!selectedIsToday && selectedClass && (
            <div className="freq-retroactive-hint">
              <IcClock />
              <span>
                Registrando presença fora do dia agendado. A turma{" "}
                <strong>{selectedClass.name}</strong> não tem aula hoje.
              </span>
            </div>
          )}

          {/* Kanban */}
          <div className="freq-kanban">
            <Column
              label="Ausente"
              tone="muted"
              icon={<IcUserX />}
              cards={colAbsent}
              renderActions={(s) => (
                <button
                  className="freq-card-btn freq-card-btn--primary"
                  onClick={() => handleAction("confirm", s.userId)}
                  disabled={actingOn === s.userId}
                >
                  <IcUserCheck />
                  <span>Registrar</span>
                </button>
              )}
              loading={loading}
            />
            <Column
              label="Check-in realizado"
              tone="gold"
              icon={<IcClock />}
              cards={colRegistered}
              renderActions={(s) => (
                <>
                  <button
                    className="freq-card-btn freq-card-btn--success"
                    onClick={() => handleAction("confirm", s.userId)}
                    disabled={actingOn === s.userId}
                  >
                    <IcCheckCircle />
                    <span>Confirmar</span>
                  </button>
                  <button
                    className="freq-card-btn freq-card-btn--danger"
                    onClick={() => handleAction("reject", s.userId)}
                    disabled={actingOn === s.userId}
                  >
                    <IcXCircle />
                    <span>Rejeitar</span>
                  </button>
                </>
              )}
              loading={loading}
            />
            <Column
              label="Presença confirmada"
              tone="success"
              icon={<IcCheckCircle />}
              cards={colConfirmed}
              renderActions={() => (
                <span className="freq-card-check">
                  <IcCheck />
                </span>
              )}
              loading={loading}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ── Column ─────────────────────────────────────────────────────────────── */

interface ColumnProps {
  label: string;
  tone: "muted" | "gold" | "success";
  icon: React.ReactNode;
  cards: StudentCard[];
  renderActions: (s: StudentCard) => React.ReactNode;
  loading: boolean;
}

function Column({ label, tone, icon, cards, renderActions, loading }: ColumnProps) {
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
            <span className="freq-col-empty-icon">{icon}</span>
            <p>Nenhum aluno</p>
          </div>
        ) : (
          cards.map((s) => (
            <PersonCard key={s.userId} student={s}>
              {renderActions(s)}
            </PersonCard>
          ))
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
  const isTeacher =
    (student.roles ?? []).includes("teacher") ||
    (student.roles ?? []).includes("instructor");
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
          {isTeacher && <span className="freq-card-role-chip">Prof</span>}
        </div>
        <div className="freq-card-meta">
          {student.age != null && <span>{student.age} anos</span>}
          {student.ageCategory && (
            <>
              {student.age != null && <span>·</span>}
              <span>{student.ageCategory}</span>
            </>
          )}
          {student.source === "qr" && (
            <>
              <span>·</span>
              <span className="freq-card-qr">QR</span>
            </>
          )}
        </div>
        {student.guardianName && (
          <div className="freq-card-guardian">resp. {student.guardianName}</div>
        )}
      </div>
      <div className="freq-card-actions">{children}</div>
    </div>
  );
}
