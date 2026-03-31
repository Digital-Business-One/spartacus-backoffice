import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { usePagination } from "../hooks/usePagination";

interface AccountAction {
  action: string;
  label: string;
  target_status: string;
}

interface Account {
  uid: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
  birth_date?: string;
  gender?: string;
  phone?: string;
  created_at?: string;
  is_dependent: boolean;
  guardian_uid?: string;
  class_ids: string[];
  class_names: string[];
  available_actions: AccountAction[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting_email_confirmation: { label: "Aguardando e-mail", color: "var(--text-muted)" },
  pending_approval: { label: "Pendente", color: "var(--gold)" },
  waiting_medical_history: { label: "Aguardando anamnese", color: "#F59E0B" },
  pending_medical_history_approval: { label: "Anamnese em revisão", color: "#F59E0B" },
  approved: { label: "Ativo", color: "var(--success)" },
  rejected: { label: "Rejeitado", color: "var(--error)" },
  expelled: { label: "Expulso", color: "var(--error)" },
  archived: { label: "Arquivado", color: "var(--text-muted)" },
  waiting_registration_review: { label: "Revisão solicitada", color: "#F59E0B" },
  revised_registration: { label: "Revisado", color: "#F59E0B" },
};

const ROLE_LABELS: Record<string, string> = {
  student: "Aluno",
  guardian: "Responsável",
  teacher: "Professor",
  instructor: "Instrutor",
  owner: "Controlador",
  assistant: "Assistente",
  supporter: "Apoiador",
  sponsor: "Patrocinador",
};

// Age helpers
const AGE_RANGES = [
  { label: "Kids", min: 0, max: 10 },
  { label: "Infanto Juvenil", min: 11, max: 17 },
  { label: "Adulto", min: 18, max: null as number | null },
];

function calcAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const parts = birthDate.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  const dob = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const md = now.getMonth() - dob.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function getAgeRangeLabel(age: number): string {
  for (const r of AGE_RANGES) {
    if (age >= r.min && (r.max === null || age <= r.max)) return r.label;
  }
  return "";
}

const CLASS_DISPLAY_ROLES = new Set(["student", "teacher", "instructor"]);

type FilterTab = "email" | "pending" | "anamnese" | "review" | "active" | "blocked" | "all";

// Sub-status options per tab (tabs with multiple statuses)
const TAB_SUB_STATUSES: Partial<Record<FilterTab, { value: string; label: string }[]>> = {
  anamnese: [
    { value: "waiting_medical_history", label: "Aguardando anamnese" },
    { value: "pending_medical_history_approval", label: "Anamnese em revisão" },
  ],
  review: [
    { value: "waiting_registration_review", label: "Revisão solicitada" },
    { value: "revised_registration", label: "Cadastro revisado" },
  ],
  blocked: [
    { value: "rejected", label: "Rejeitado" },
    { value: "expelled", label: "Expulso" },
    { value: "archived", label: "Arquivado" },
  ],
};

const ALL_ROLES = Object.entries(ROLE_LABELS);

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("pending");
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<Account[]>("/accounts");
      setAccounts(result);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  async function handleTransition(uid: string, action: string) {
    setTransitioning(uid);
    try {
      await api.post(`/accounts/${uid}/transitions`, { action });
      await fetchAccounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao executar ação";
      alert(msg);
    } finally {
      setTransitioning(null);
    }
  }

  const filtered = accounts.filter((a) => {
    // Tab filter
    let tabMatch = true;
    if (tab === "email") tabMatch = a.status === "waiting_email_confirmation";
    else if (tab === "pending") tabMatch = a.status === "pending_approval";
    else if (tab === "anamnese") tabMatch = ["waiting_medical_history", "pending_medical_history_approval"].includes(a.status);
    else if (tab === "review") tabMatch = ["waiting_registration_review", "revised_registration"].includes(a.status);
    else if (tab === "active") tabMatch = a.status === "approved";
    else if (tab === "blocked") tabMatch = ["rejected", "expelled", "archived"].includes(a.status);
    if (!tabMatch) return false;

    // Sub-status filter
    if (subStatus && a.status !== subStatus) return false;

    // Role filter
    if (roleFilter && !a.roles.includes(roleFilter)) return false;

    return true;
  });

  const counts = {
    email: accounts.filter((a) => a.status === "waiting_email_confirmation").length,
    pending: accounts.filter((a) => a.status === "pending_approval").length,
    anamnese: accounts.filter((a) => ["waiting_medical_history", "pending_medical_history_approval"].includes(a.status)).length,
    review: accounts.filter((a) => ["waiting_registration_review", "revised_registration"].includes(a.status)).length,
    active: accounts.filter((a) => a.status === "approved").length,
    blocked: accounts.filter((a) => ["rejected", "expelled", "archived"].includes(a.status)).length,
  };

  const { visible, total, hasMore, loadMore, sentinelRef } = usePagination({ items: filtered });

  function switchTab(t: FilterTab) {
    setTab(t);
    setSubStatus(null);
    setRoleFilter(null);
  }

  const currentSubStatuses = TAB_SUB_STATUSES[tab] ?? [];

  return (
    <>
      <div className="page-header">
        <h2>Contas</h2>
        <p>Gestão de contas e aprovações</p>
        <div className="page-actions">
          <Link to="/contas/nova" className="btn btn-primary btn-sm">+ Nova conta</Link>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === "email" ? "active" : ""}`} onClick={() => switchTab("email")}>
          Aguardando e-mail {counts.email > 0 && <span className="tab-badge tab-badge--muted">{counts.email}</span>}
        </button>
        <button className={`tab-btn ${tab === "pending" ? "active" : ""}`} onClick={() => switchTab("pending")}>
          Pendentes {counts.pending > 0 && <span className="tab-badge">{counts.pending}</span>}
        </button>
        <button className={`tab-btn ${tab === "anamnese" ? "active" : ""}`} onClick={() => switchTab("anamnese")}>
          Anamnese {counts.anamnese > 0 && <span className="tab-badge tab-badge--warning">{counts.anamnese}</span>}
        </button>
        <button className={`tab-btn ${tab === "review" ? "active" : ""}`} onClick={() => switchTab("review")}>
          Revisão {counts.review > 0 && <span className="tab-badge tab-badge--warning">{counts.review}</span>}
        </button>
        <button className={`tab-btn ${tab === "active" ? "active" : ""}`} onClick={() => switchTab("active")}>
          Ativos {counts.active > 0 && <span className="tab-badge tab-badge--success">{counts.active}</span>}
        </button>
        <button className={`tab-btn ${tab === "blocked" ? "active" : ""}`} onClick={() => switchTab("blocked")}>
          Bloqueados {counts.blocked > 0 && <span className="tab-badge tab-badge--muted">{counts.blocked}</span>}
        </button>
        <button className={`tab-btn ${tab === "all" ? "active" : ""}`} onClick={() => switchTab("all")}>
          Todos
        </button>
      </div>

      {/* Sub-status + role filters */}
      {(currentSubStatuses.length > 0 || !loading) && (
        <div className="filter-bar">
          {currentSubStatuses.length > 0 && (
            <div className="filter-group">
              <span className="filter-label">Status:</span>
              <button className={`filter-chip ${subStatus === null ? "active" : ""}`} onClick={() => setSubStatus(null)}>Todos</button>
              {currentSubStatuses.map((s) => (
                <button key={s.value} className={`filter-chip ${subStatus === s.value ? "active" : ""}`} onClick={() => setSubStatus(subStatus === s.value ? null : s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <div className="filter-group">
            <span className="filter-label">Perfil:</span>
            <button className={`filter-chip ${roleFilter === null ? "active" : ""}`} onClick={() => setRoleFilter(null)}>Todos</button>
            {ALL_ROLES.map(([code, label]) => (
              <button key={code} className={`filter-chip ${roleFilter === code ? "active" : ""}`} onClick={() => setRoleFilter(roleFilter === code ? null : code)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="hub-loading">
          <span className="loading-spinner" style={{ width: 24, height: 24 }} />
          <span>Carregando contas...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>Nenhuma conta {tab === "all" ? "cadastrada" : tab === "pending" ? "pendente" : tab === "active" ? "ativa" : "bloqueada"}</h3>
          <p>
            {tab === "pending"
              ? "Quando novas contas forem criadas, elas aparecerão aqui para aprovação."
              : "Nenhuma conta encontrada com este filtro."}
          </p>
        </div>
      ) : (
        <>
          <div className="account-list">
            {visible.map((account) => (
              <AccountCard
                key={account.uid}
                account={account}
                onAction={(action) => handleTransition(account.uid, action)}
                onDetail={() => navigate(`/contas/${account.uid}`)}
                loading={transitioning === account.uid}
              />
            ))}
          </div>
          <div className="pagination-footer">
            <span className="pagination-count">Exibindo {visible.length} de {total} contas</span>
            {hasMore && (
              <button className="btn btn-outline btn-sm" onClick={loadMore} style={{ marginTop: "0.5rem" }}>
                Ver mais ↓
              </button>
            )}
            <div ref={sentinelRef} />
          </div>
        </>
      )}
    </>
  );
}

function AccountCard({
  account,
  onAction,
  onDetail,
  loading,
}: {
  account: Account;
  onAction: (action: string) => void;
  onDetail: () => void;
  loading: boolean;
}) {
  const statusInfo = STATUS_LABELS[account.status] ?? { label: account.status, color: "var(--text-muted)" };
  const initials = account.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const showClassInfo = account.roles.some((r) => CLASS_DISPLAY_ROLES.has(r));
  const age = calcAge(account.birth_date);
  const ageLabel = age !== null ? getAgeRangeLabel(age) : "";

  return (
    <div className="account-card" onClick={onDetail}>
      <div className="account-card-header">
        <div className="account-avatar">{initials}</div>
        <div className="account-info">
          <div className="account-name">{account.name}</div>
          <div className="account-email">{account.email}</div>
          <div className="account-meta">
            {account.roles.map((r) => (
              <span key={r} className="chip" style={{ fontSize: "0.7rem", padding: "0.1rem 0.5rem" }}>
                {ROLE_LABELS[r] ?? r}
              </span>
            ))}
            {account.is_dependent && <span className="chip" style={{ fontSize: "0.7rem", padding: "0.1rem 0.5rem", background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>Dependente</span>}
            {showClassInfo && age !== null && (
              <span className="chip" style={{ fontSize: "0.7rem", padding: "0.1rem 0.5rem", background: "rgba(76,175,80,0.12)", color: "var(--success)" }}>
                {age} anos{ageLabel ? ` · ${ageLabel}` : ""}
              </span>
            )}
          </div>
          {showClassInfo && account.class_names.length > 0 && (
            <div className="account-classes">
              {account.class_names.join(", ")}
            </div>
          )}
        </div>
        <div className="account-status">
          <span className="status-badge" style={{ color: statusInfo.color, borderColor: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {account.available_actions.length > 0 && (
        <div className="account-actions" onClick={(e) => e.stopPropagation()}>
          {account.available_actions.map((action) => (
            <button
              key={action.action}
              className={`account-action-btn ${action.action === "reject" || action.action === "expel" ? "account-action-btn--danger" : ""}`}
              onClick={() => onAction(action.action)}
              disabled={loading}
            >
              {loading ? "..." : action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
