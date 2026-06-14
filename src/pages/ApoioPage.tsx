import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const PROJECT_ID =
  import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "spartacus-artes-marciais";

/* ── Types ──────────────────────────────────────────────────────────────── */

type SupportType = "donation" | "service";
type Status = "pledged" | "received" | "absent";

interface RecordCard {
  id: string;
  userId: string;
  name: string;
  nickname?: string | null;
  initials: string;
  age?: number | null;
  photoUrl?: string | null;
  supportType: SupportType;
  item?: string | null;
  itemLabel?: string | null;
  itemDescription?: string | null;
  status: Status;
  createdAt?: string | null;
}

interface DashboardResponse {
  month: string;
  monthLabel: string;
  items: RecordCard[];
}

interface ConfigItem { code: string; label: string; active: boolean }
interface SupportConfig { donations: ConfigItem[]; services: ConfigItem[] }

/* ── Icons ──────────────────────────────────────────────────────────────── */

const Svg = ({ children, size = 14 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcClock = () => (<Svg><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Svg>);
const IcCheckCircle = () => (<Svg><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Svg>);
const IcXCircle = () => (<Svg><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></Svg>);
const IcCheck = () => (<Svg><polyline points="20 6 9 17 4 12" /></Svg>);
const IcPlus = () => (<Svg><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Svg>);
const IcPrev = () => (<Svg><polyline points="15 18 9 12 15 6" /></Svg>);
const IcNext = () => (<Svg><polyline points="9 18 15 12 9 6" /></Svg>);

const TYPE_LABEL: Record<SupportType, string> = { donation: "Doação", service: "Serviço" };
const TYPE_COLOR: Record<SupportType, string> = { donation: "#0D9488", service: "#7C3AED" };

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function ApoioPage() {
  const [anchor, setAnchor] = useState(() => new Date());
  const [typeFilter, setTypeFilter] = useState<"all" | SupportType>("all");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const month = useMemo(() => monthKey(anchor), [anchor]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ month });
      if (typeFilter !== "all") qs.set("type", typeFilter);
      const res = await api.get<DashboardResponse>(`/support/dashboard?${qs}`);
      setData(res);
    } catch (err) {
      console.error("[ApoioPage] dashboard fetch failed:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [month, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const act = useCallback(
    async (path: string, body: object, id: string) => {
      setActingOn(id);
      try {
        await api.post(path, body);
        await fetchData();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "Falha na operação.");
      } finally {
        setActingOn(null);
      }
    },
    [fetchData],
  );

  const validate = useCallback(
    async (rec: RecordCard, status: "received" | "absent") => {
      setActingOn(rec.id);
      try {
        await api.patch(`/support/${encodeURIComponent(rec.id)}/validate`, { status });
        await fetchData();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "Falha na operação.");
      } finally {
        setActingOn(null);
      }
    },
    [fetchData],
  );

  const items = useMemo(() => {
    let list = data?.items ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) => r.name.toLowerCase().includes(q) || (r.nickname ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, search]);

  const pledged = items.filter((r) => r.status === "pledged");
  const received = items.filter((r) => r.status === "received");
  const absent = items.filter((r) => r.status === "absent");

  return (
    <div className="freq-fullwidth">
      <div className="freq-header">
        <div>
          <h2 className="settings-title">APOIO</h2>
          <p>Doações e serviços — registro e aprovação</p>
        </div>
        <button className="cal-new-btn" onClick={() => setRegisterOpen(true)}>
          <IcPlus /> Registrar apoio
        </button>
      </div>

      <div className="apoio-toolbar">
        <div className="cal-nav">
          <button className="cal-icon-btn" onClick={() => setAnchor((d) => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}><IcPrev /></button>
          <span className="cal-period">{data?.monthLabel ?? ""}</span>
          <button className="cal-icon-btn" onClick={() => setAnchor((d) => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}><IcNext /></button>
          <button className="cal-today-btn" onClick={() => setAnchor(new Date())}>Mês atual</button>
        </div>
        <div className="grad-chips">
          {(["all", "donation", "service"] as const).map((t) => (
            <button key={t} className={`grad-chip ${typeFilter === t ? "active" : ""}`} onClick={() => setTypeFilter(t)}>
              {t === "all" ? "Todos" : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <div className="grad-search">
          <input placeholder="Buscar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="freq-kanban">
        <Column label="Aguardando" tone="gold" icon={<IcClock />} cards={pledged} loading={loading}
          renderActions={(r) => (
            <>
              <button className="freq-card-btn freq-card-btn--success" disabled={actingOn === r.id}
                onClick={() => validate(r, "received")}><IcCheckCircle /><span>Aprovar</span></button>
              <button className="freq-card-btn freq-card-btn--danger" disabled={actingOn === r.id}
                onClick={() => validate(r, "absent")}><IcXCircle /><span>Reprovar</span></button>
            </>
          )} />
        <Column label="Aprovado" tone="success" icon={<IcCheckCircle />} cards={received} loading={loading}
          renderActions={(r) => (
            <>
              <span className="freq-card-check"><IcCheck /></span>
              <button className="freq-card-undo" title="Desfazer aprovação" disabled={actingOn === r.id}
                onClick={() => act(`/support/${encodeURIComponent(r.id)}/undo-validation`, {}, r.id)}><IcXCircle /></button>
            </>
          )} />
        <Column label="Reprovado" tone="muted" icon={<IcXCircle />} cards={absent} loading={loading}
          renderActions={(r) => (
            <button className="freq-card-btn freq-card-btn--success" disabled={actingOn === r.id}
              onClick={() => validate(r, "received")}><IcCheckCircle /><span>Aprovar</span></button>
          )} />
      </div>

      {registerOpen && (
        <RegisterModal onClose={() => setRegisterOpen(false)} onDone={() => { setRegisterOpen(false); fetchData(); }} />
      )}
    </div>
  );
}

/* ── Column ─────────────────────────────────────────────────────────────── */

function Column({ label, tone, icon, cards, renderActions, loading }: {
  label: string; tone: "muted" | "gold" | "success"; icon: React.ReactNode;
  cards: RecordCard[]; renderActions: (r: RecordCard) => React.ReactNode; loading: boolean;
}) {
  return (
    <div className={`freq-col freq-col--${tone}`}>
      <div className="freq-col-header">
        <span className="freq-col-icon">{icon}</span>
        <span className="freq-col-label">{label}</span>
        <span className="freq-col-count">{cards.length}</span>
      </div>
      <div className="freq-col-body">
        {loading ? (
          <div className="hub-loading-inline" style={{ padding: "2rem 0" }}><span className="loading-spinner" /></div>
        ) : cards.length === 0 ? (
          <div className="freq-col-empty"><p>Nada aqui</p></div>
        ) : (
          cards.map((r) => (
            <div key={r.id} className="freq-card">
              <div className="freq-card-avatar">
                {r.photoUrl ? <img src={r.photoUrl} alt={r.name} /> : <span>{r.initials}</span>}
              </div>
              <div className="freq-card-body">
                <div className="freq-card-name-line">
                  <span className="freq-card-name">{r.nickname ? `${r.name} / ${r.nickname}` : r.name}</span>
                  <span className="apoio-type-badge" style={{ background: `${TYPE_COLOR[r.supportType]}22`, color: TYPE_COLOR[r.supportType] }}>
                    {TYPE_LABEL[r.supportType]}
                  </span>
                </div>
                <div className="freq-card-meta">
                  {r.itemLabel && <span>{r.itemLabel}{r.itemDescription ? `: ${r.itemDescription}` : ""}</span>}
                </div>
              </div>
              <div className="freq-card-actions">{renderActions(r)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Register modal (staff registers a support on behalf) ───────────────── */

interface StudentLite { uid: string; name: string }

function RegisterModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [config, setConfig] = useState<SupportConfig | null>(null);
  const [supportType, setSupportType] = useState<SupportType>("donation");
  const [item, setItem] = useState("");
  const [description, setDescription] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [studentId, setStudentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<SupportConfig>(`/projects/${PROJECT_ID}/support-config`)
      .then(setConfig).catch(() => setConfig({ donations: [], services: [] }));
  }, []);

  useEffect(() => {
    const q = studentSearch.trim();
    if (q.length < 2) { setStudents([]); return; }
    const t = setTimeout(() => {
      api.get<{ items: { uid: string; name: string }[] }>(
        `/accounts?role=student&search=${encodeURIComponent(q)}&pageSize=8`,
      ).then((r) => setStudents(r.items ?? [])).catch(() => setStudents([]));
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  const options = config ? (supportType === "donation" ? config.donations : config.services) : [];

  async function save() {
    if (!studentId || !item) { setError("Selecione o aluno e o item."); return; }
    if (item === "other" && !description.trim()) { setError("Descreva a forma de apoio."); return; }
    setSaving(true); setError(null);
    try {
      await api.post("/support/register-received", {
        userId: studentId, supportType, item,
        itemDescription: description.trim() || null,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao registrar.");
    } finally { setSaving(false); }
  }

  return (
    <div className="mod-modal-overlay" onClick={onClose}>
      <div className="mod-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="mod-modal-title">Registrar apoio</h3>
        <p className="mod-modal-subtitle">Registra um apoio já recebido (aprovado) em nome do aluno.</p>

        <div className="cal-type-grid" style={{ marginBottom: "0.6rem" }}>
          {(["donation", "service"] as SupportType[]).map((t) => (
            <button key={t} type="button" className={`cal-type-btn ${supportType === t ? "active" : ""}`}
              onClick={() => { setSupportType(t); setItem(""); }}
              style={supportType === t ? { borderColor: TYPE_COLOR[t], background: `${TYPE_COLOR[t]}1f` } : undefined}>
              <span className="cal-type-dot" style={{ background: TYPE_COLOR[t] }} />
              <span className="cal-type-name">{TYPE_LABEL[t]}</span>
            </button>
          ))}
        </div>

        <select className="mod-modal-textarea" style={{ minHeight: 0 }} value={item} onChange={(e) => setItem(e.target.value)}>
          <option value="">Selecione o item…</option>
          {options.filter((o) => o.active).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
        </select>
        {item === "other" && (
          <input className="mod-modal-textarea" style={{ minHeight: 0, marginTop: "0.4rem" }}
            placeholder="Descreva o apoio" value={description} onChange={(e) => setDescription(e.target.value)} />
        )}

        <input className="mod-modal-textarea" style={{ minHeight: 0, marginTop: "0.4rem" }}
          placeholder="Buscar aluno (nome)…" value={studentSearch}
          onChange={(e) => { setStudentSearch(e.target.value); setStudentId(""); }} />
        {students.length > 0 && (
          <div className="apoio-student-list">
            {students.map((s) => (
              <button key={s.uid} className={`apoio-student-row ${studentId === s.uid ? "active" : ""}`}
                onClick={() => { setStudentId(s.uid); setStudentSearch(s.name); setStudents([]); }}>
                {s.name}
              </button>
            ))}
          </div>
        )}

        {error && <p className="cal-error">{error}</p>}
        <div className="mod-modal-actions">
          <button className="btn btn-sm btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-sm btn-primary" onClick={save} disabled={saving || !studentId || !item}>
            {saving ? "..." : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
