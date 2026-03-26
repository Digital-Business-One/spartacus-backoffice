import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

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

type FilterTab = "pending" | "active" | "blocked" | "all";

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("pending");
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
    if (tab === "pending") return ["pending_approval", "waiting_email_confirmation", "revised_registration"].includes(a.status);
    if (tab === "active") return a.status === "approved";
    if (tab === "blocked") return ["rejected", "expelled", "archived", "waiting_registration_review", "waiting_medical_history", "pending_medical_history_approval"].includes(a.status);
    return true;
  });

  const counts = {
    pending: accounts.filter((a) => ["pending_approval", "waiting_email_confirmation", "revised_registration"].includes(a.status)).length,
    active: accounts.filter((a) => a.status === "approved").length,
    blocked: accounts.filter((a) => !["pending_approval", "waiting_email_confirmation", "revised_registration", "approved"].includes(a.status)).length,
  };

  return (
    <>
      <div className="page-header">
        <Link to="/" className="back-link">← Voltar ao projeto</Link>
        <h2>Contas</h2>
        <p>Gestão de contas e aprovações</p>
        <div className="page-actions">
          <Link to="/contas/nova" className="btn btn-primary btn-sm">+ Nova conta</Link>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>
          Pendentes {counts.pending > 0 && <span className="tab-badge">{counts.pending}</span>}
        </button>
        <button className={`tab-btn ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>
          Ativos {counts.active > 0 && <span className="tab-badge tab-badge--success">{counts.active}</span>}
        </button>
        <button className={`tab-btn ${tab === "blocked" ? "active" : ""}`} onClick={() => setTab("blocked")}>
          Bloqueados {counts.blocked > 0 && <span className="tab-badge tab-badge--muted">{counts.blocked}</span>}
        </button>
        <button className={`tab-btn ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>
          Todos
        </button>
      </div>

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
        <div className="account-list">
          {filtered.map((account) => (
            <AccountCard
              key={account.uid}
              account={account}
              onAction={(action) => handleTransition(account.uid, action)}
              onDetail={() => navigate(`/contas/${account.uid}`)}
              loading={transitioning === account.uid}
            />
          ))}
        </div>
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
          </div>
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
