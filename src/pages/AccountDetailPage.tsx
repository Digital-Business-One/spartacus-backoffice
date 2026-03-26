import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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

const STATUS_LABELS: Record<string, string> = {
  waiting_email_confirmation: "Aguardando confirmação de e-mail",
  pending_approval: "Pendente de aprovação",
  waiting_medical_history: "Aguardando anamnese",
  pending_medical_history_approval: "Anamnese em revisão",
  approved: "Conta ativa",
  rejected: "Cadastro rejeitado",
  expelled: "Expulso",
  archived: "Arquivado",
  waiting_registration_review: "Revisão cadastral solicitada",
  revised_registration: "Cadastro revisado",
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

export function AccountDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    api.get<Account>(`/accounts/${uid}`)
      .then(setAccount)
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));
  }, [uid]);

  async function handleAction(action: string) {
    if (!uid) return;
    setActing(true);
    try {
      await api.post(`/accounts/${uid}/transitions`, { action });
      const updated = await api.get<Account>(`/accounts/${uid}`);
      setAccount(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro";
      alert(msg);
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="hub-loading">
        <span className="loading-spinner" style={{ width: 24, height: 24 }} />
        <span>Carregando conta...</span>
      </div>
    );
  }

  if (!account) {
    return (
      <>
        <div className="page-header">
          <Link to="/contas" className="back-link">← Voltar</Link>
          <h2>Conta não encontrada</h2>
        </div>
      </>
    );
  }

  const initials = account.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <div className="page-header">
        <Link to="/contas" className="back-link">← Voltar às contas</Link>
      </div>

      <div className="detail-header">
        <div className="detail-avatar">{initials}</div>
        <h2 className="detail-name">{account.name}</h2>
        <p className="detail-email">{account.email}</p>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center", marginTop: "0.5rem" }}>
          {account.roles.map((r) => (
            <span key={r} className="chip">{ROLE_LABELS[r] ?? r}</span>
          ))}
        </div>
      </div>

      <div className="hub-sections" style={{ marginTop: "1.5rem" }}>
        {/* Status section */}
        <div className="hub-section">
          <div className="hub-section-header">
            <div className="hub-section-icon">📊</div>
            <div className="hub-section-titles">
              <h3 className="hub-section-title">Status</h3>
              <p className="hub-section-subtitle">{STATUS_LABELS[account.status] ?? account.status}</p>
            </div>
          </div>
          {account.available_actions.length > 0 && (
            <div className="hub-section-body">
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "0.75rem" }}>
                Ações disponíveis para esta conta:
              </p>
              <div className="detail-actions">
                {account.available_actions.map((a) => (
                  <button
                    key={a.action}
                    className={`btn btn-sm ${a.action === "reject" || a.action === "expel" ? "btn-outline detail-btn--danger" : a.action.startsWith("approve") || a.action === "reactivate" ? "btn-primary" : "btn-outline"}`}
                    onClick={() => handleAction(a.action)}
                    disabled={acting}
                  >
                    {acting ? "..." : a.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Personal data section */}
        <div className="hub-section">
          <div className="hub-section-header">
            <div className="hub-section-icon">👤</div>
            <div className="hub-section-titles">
              <h3 className="hub-section-title">Dados Pessoais</h3>
            </div>
          </div>
          <div className="hub-section-body">
            <div className="review-section-card">
              <DetailRow label="Nome" value={account.name} />
              <DetailRow label="E-mail" value={account.email} />
              <DetailRow label="Nascimento" value={account.birth_date} />
              <DetailRow label="Gênero" value={account.gender === "male" ? "Masculino" : account.gender === "female" ? "Feminino" : undefined} />
              <DetailRow label="Telefone" value={account.phone} />
              <DetailRow label="Cadastro" value={account.created_at?.split("T")[0]} />
              {account.is_dependent && <DetailRow label="Responsável" value={account.guardian_uid} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="review-row">
      <span className="review-row-label">{label}</span>
      <span className="review-row-value">{value || "—"}</span>
    </div>
  );
}
