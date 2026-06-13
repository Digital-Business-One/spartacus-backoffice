import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { GraduationBadge } from "../components/account/GraduationBadge";

const PROJECT_ID =
  import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "spartacus-artes-marciais";

/* ── Types (mirror backend) ─────────────────────────────────────────────── */

interface Belt {
  order: number;
  slug: string;
  name: string;
  color: string;
  maxDegree: number;
}
interface AgeBand {
  minAge: number;
  maxAge: number;
  belts: Belt[];
}
interface GradSystem {
  modalitySlug: string;
  modalityName: string;
  type: "age_banded" | "linear";
  ageBands: AgeBand[];
}
interface NextBelt {
  slug: string;
  name: string;
  color: string;
  maxDegree: number;
}
interface StudentCard {
  userId: string;
  name: string;
  nickname?: string | null;
  initials: string;
  age?: number | null;
  photoUrl?: string | null;
  isDependent: boolean;
  guardianName?: string | null;
  belt?: string | null;
  beltName?: string | null;
  color?: string | null;
  degree: number;
  status: "none" | "pending" | "approved" | "rejected";
  maxDegree: number;
  canAddDegree: boolean;
  nextBelt?: NextBelt | null;
  outOfBand: boolean;
  canUndo: boolean;
}
interface DashboardResponse {
  modalitySlug: string;
  modalityName: string;
  hasSystem: boolean;
  students: StudentCard[];
}

/* ── Icons ──────────────────────────────────────────────────────────────── */

const Svg = ({ children, size = 14 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcChevronDown = () => (<Svg><polyline points="6 9 12 15 18 9" /></Svg>);
const IcCheck = () => (<Svg><polyline points="20 6 9 17 4 12" /></Svg>);
const IcPlus = () => (<Svg><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Svg>);
const IcArrow = () => (<Svg><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></Svg>);
const IcUndo = () => (<Svg><polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 00-4-4H4" /></Svg>);
const IcX = () => (<Svg><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>);
const IcSearch = () => (<Svg><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Svg>);
const IcKebab = () => (<Svg size={18}><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></Svg>);

/* ── Page ───────────────────────────────────────────────────────────────── */

type StatusFilter = "all" | "pending" | "rejected" | "none" | "approved";

export function GraduacoesPage() {
  const [systems, setSystems] = useState<GradSystem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [bandIdx, setBandIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load the graduation matrix once
  useEffect(() => {
    api
      .get<{ systems: GradSystem[] }>(
        `/projects/${PROJECT_ID}/graduation-systems`,
      )
      .then((r) => {
        setSystems(r.systems);
        if (r.systems.length) setSelectedSlug(r.systems[0].modalitySlug);
      })
      .catch(() => setSystems([]));
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [dropdownOpen]);

  // Close any open card menu on outside click
  useEffect(() => {
    if (!menuFor) return;
    const h = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".grad-card-menu"))
        setMenuFor(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuFor]);

  const fetchDashboard = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      const data = await api.get<DashboardResponse>(
        `/graduations/dashboard?modality=${encodeURIComponent(slug)}`,
      );
      setDashboard(data);
    } catch (err) {
      console.error("[GraduacoesPage] dashboard fetch failed:", err);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSlug) {
      setBandIdx(0);
      fetchDashboard(selectedSlug);
    }
  }, [selectedSlug, fetchDashboard]);

  const system = useMemo(
    () => systems.find((s) => s.modalitySlug === selectedSlug) ?? null,
    [systems, selectedSlug],
  );
  const bands = system?.ageBands ?? [];
  const ageBanded = system?.type === "age_banded" && bands.length > 1;
  const activeBand = bands[bandIdx];

  const act = useCallback(
    async (path: string, body: object, uid: string) => {
      if (!selectedSlug) return;
      setActingOn(uid);
      try {
        await api.post(path, body);
        await fetchDashboard(selectedSlug);
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "Falha na operação.");
      } finally {
        setActingOn(null);
      }
    },
    [selectedSlug, fetchDashboard],
  );

  const students = useMemo(
    () => dashboard?.students ?? [],
    [dashboard],
  );
  const pendingCount = students.filter((s) => s.status === "pending").length;

  const visible = useMemo(() => {
    let list = students;
    if (ageBanded && activeBand) {
      list = list.filter(
        (s) =>
          s.age != null &&
          s.age >= activeBand.minAge &&
          s.age <= activeBand.maxAge,
      );
    }
    if (statusFilter !== "all")
      list = list.filter((s) => s.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.nickname ?? "").toLowerCase().includes(q),
      );
    }
    // needs-attention first (pending, then rejected), then by name
    const rank = (st: string) =>
      st === "pending" ? 0 : st === "rejected" ? 1 : 2;
    return [...list].sort((a, b) => {
      const r = rank(a.status) - rank(b.status);
      return r !== 0 ? r : a.name.localeCompare(b.name);
    });
  }, [students, ageBanded, activeBand, statusFilter, search]);

  const FILTERS: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "pending", label: "Pendentes" },
    { id: "rejected", label: "Reprovadas" },
    { id: "none", label: "Sem graduação" },
    { id: "approved", label: "Graduados" },
  ];

  return (
    <div className="grad-page">
      <div className="grad-hero">
        <div>
          <h2 className="grad-title">GRADUAÇÕES</h2>
          <p className="grad-sub">A jornada da faixa — evolua seus alunos</p>
        </div>
        {pendingCount > 0 && (
          <div className="grad-pending-badge">
            <span className="grad-pending-dot" />
            {pendingCount} aguardando aprovação
          </div>
        )}
      </div>

      {/* Modality selector */}
      <div ref={dropdownRef} className="grad-modality-selector">
        <button
          className="grad-modality-btn"
          onClick={() => setDropdownOpen((v) => !v)}
        >
          <span className="grad-modality-name">
            {system?.modalityName ?? "Selecione a modalidade"}
          </span>
          <span className="grad-modality-type">
            {system
              ? system.type === "age_banded"
                ? "por faixa etária"
                : "linear"
              : ""}
          </span>
          <span className={`grad-chevron ${dropdownOpen ? "open" : ""}`}>
            <IcChevronDown />
          </span>
        </button>
        {dropdownOpen && (
          <div className="grad-modality-dropdown">
            {systems.map((s) => (
              <button
                key={s.modalitySlug}
                className={`grad-modality-option ${s.modalitySlug === selectedSlug ? "active" : ""}`}
                onClick={() => {
                  setSelectedSlug(s.modalitySlug);
                  setDropdownOpen(false);
                }}
              >
                <span>{s.modalityName}</span>
                {s.modalitySlug === selectedSlug && <IcCheck />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Age band selector — above the track it controls (jiu-jitsu) */}
      {ageBanded && (
        <div className="grad-bandbar">
          <span className="grad-bandbar-label">Faixa etária</span>
          <div className="grad-chips">
            {bands.map((b, i) => (
              <button
                key={i}
                className={`grad-chip ${bandIdx === i ? "active" : ""}`}
                onClick={() => setBandIdx(i)}
              >
                {b.maxAge >= 200 ? `${b.minAge}+` : `${b.minAge}–${b.maxAge}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Belt track legend — the canonical path for the selected band */}
      {activeBand && (
        <div className="grad-track">
          {activeBand.belts.map((b, i) => (
            <div key={b.slug} className="grad-track-step">
              <span
                className="grad-track-belt"
                style={{ background: b.color }}
                title={b.name}
              />
              <span className="grad-track-label">{b.name}</span>
              {i < activeBand.belts.length - 1 && (
                <span className="grad-track-arrow">›</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="grad-filters">
        <div className="grad-chips">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`grad-chip ${statusFilter === f.id ? "active" : ""}`}
              onClick={() => setStatusFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="grad-search">
          <IcSearch />
          <input
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Student cards */}
      {loading ? (
        <div className="hub-loading" style={{ padding: "3rem 0" }}>
          <span className="loading-spinner" style={{ width: 22, height: 22 }} />
          <span>Carregando alunos...</span>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state" style={{ marginTop: "2rem" }}>
          <div className="empty-state-icon">🥋</div>
          <h3>Nenhum aluno</h3>
          <p>Ajuste os filtros ou selecione outra modalidade.</p>
        </div>
      ) : (
        <div className="grad-grid">
          {visible.map((s, i) => (
            <article
              key={s.userId}
              className={`grad-card ${s.status === "pending" ? "grad-card--pending" : ""}`}
              style={{ animationDelay: `${Math.min(i * 0.03, 0.4)}s` }}
            >
              <div className="grad-card-main">
                <div className="grad-avatar">
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt={s.name} />
                  ) : (
                    <span>{s.initials}</span>
                  )}
                </div>
                <div className="grad-card-id">
                  <div className="grad-card-name-line">
                    <span className="grad-card-name">
                      {s.nickname ? `${s.name} / ${s.nickname}` : s.name}
                    </span>
                    {s.status === "pending" && (
                      <span className="grad-status grad-status--pending">
                        pendente
                      </span>
                    )}
                    {s.status === "rejected" && (
                      <span className="grad-status grad-status--rejected">
                        reprovada
                      </span>
                    )}
                  </div>
                  <span className="grad-card-meta">
                    {s.age != null && <>{s.age} anos</>}
                    {s.beltName && (
                      <>
                        {s.age != null && " · "}
                        {s.beltName}
                        {s.degree > 0 && ` · ${s.degree}º grau`}
                      </>
                    )}
                  </span>
                  {s.nextBelt && (
                    <div className="grad-next">
                      <span className="grad-next-label">Próxima</span>
                      <span
                        className="grad-next-dot"
                        style={{ background: s.nextBelt.color }}
                      />
                      <span className="grad-next-name">{s.nextBelt.name}</span>
                    </div>
                  )}
                  {s.outOfBand && (
                    <div className="grad-next grad-next--warn">
                      faixa fora da faixa etária atual
                    </div>
                  )}
                </div>

                {/* Vertical belt ribbon — same visual as the accounts cards */}
                {s.belt ? (
                  <GraduationBadge
                    modalityId={selectedSlug ?? ""}
                    entry={{
                      belt: s.belt,
                      degree: s.degree,
                      status:
                        s.status === "pending" || s.status === "rejected"
                          ? s.status
                          : "approved",
                    }}
                  />
                ) : (
                  <div className="grad-ribbon-empty" title="sem graduação" />
                )}

              {(s.status === "pending" ||
                s.status === "rejected" ||
                s.canAddDegree ||
                s.nextBelt ||
                s.canUndo) && (
                <div className="grad-card-menu">
                  <button
                    className="grad-kebab"
                    aria-label="Ações"
                    disabled={actingOn === s.userId}
                    onClick={() =>
                      setMenuFor(menuFor === s.userId ? null : s.userId)
                    }
                  >
                    <IcKebab />
                  </button>
                  {menuFor === s.userId && (
                    <div className="grad-menu-dropdown">
                      {(s.status === "pending" || s.status === "rejected") && (
                        <button
                          className="grad-menu-item"
                          onClick={() => {
                            setMenuFor(null);
                            act(
                              `/graduations/${s.userId}/approve`,
                              { modality: selectedSlug },
                              s.userId,
                            );
                          }}
                        >
                          <IcCheck /> Aprovar
                        </button>
                      )}
                      {s.status === "pending" && (
                        <button
                          className="grad-menu-item grad-menu-item--danger"
                          onClick={() => {
                            setMenuFor(null);
                            act(
                              `/graduations/${s.userId}/reject`,
                              { modality: selectedSlug },
                              s.userId,
                            );
                          }}
                        >
                          <IcX /> Reprovar
                        </button>
                      )}
                      {s.canAddDegree && (
                        <button
                          className="grad-menu-item"
                          onClick={() => {
                            setMenuFor(null);
                            act(
                              `/graduations/${s.userId}/promote`,
                              { modality: selectedSlug, kind: "degree" },
                              s.userId,
                            );
                          }}
                        >
                          <IcPlus /> Adicionar grau
                        </button>
                      )}
                      {s.nextBelt && (
                        <button
                          className="grad-menu-item"
                          onClick={() => {
                            setMenuFor(null);
                            act(
                              `/graduations/${s.userId}/promote`,
                              { modality: selectedSlug, kind: "belt" },
                              s.userId,
                            );
                          }}
                        >
                          <IcArrow />{" "}
                          {s.belt
                            ? `Promover para ${s.nextBelt.name}`
                            : `Graduar (${s.nextBelt.name})`}
                        </button>
                      )}
                      {s.canUndo && (
                        <button
                          className="grad-menu-item grad-menu-item--muted"
                          onClick={() => {
                            setMenuFor(null);
                            act(
                              `/graduations/${s.userId}/undo`,
                              { modality: selectedSlug },
                              s.userId,
                            );
                          }}
                        >
                          <IcUndo /> Desfazer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
