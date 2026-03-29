import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface AccountAction {
  action: string;
  label: string;
  target_status: string;
}

interface Address {
  postal_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
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
  whatsapp?: string;
  address?: Address;
  created_at?: string;
  is_dependent: boolean;
  guardian_uid?: string;
  class_ids: string[];
  class_names: string[];
  available_actions: AccountAction[];
}

type DetailTab = "personal" | "contact" | "address" | "classes";

/* ── Constants ─────────────────────────────────────────────────────────────── */

const TABS: { id: DetailTab; label: string }[] = [
  { id: "personal", label: "Dados Pessoais" },
  { id: "contact", label: "Contato" },
  { id: "address", label: "Endereço" },
  { id: "classes", label: "Turmas" },
];

const STATUS_DISPLAY: Record<string, { icon: string; label: string }> = {
  pending_approval: { icon: "⏳", label: "Pendente de aprovação" },
  waiting_medical_history: { icon: "📋", label: "Aguardando anamnese" },
  pending_medical_history_approval: { icon: "🔬", label: "Anamnese em revisão" },
  approved: { icon: "✅", label: "Conta ativa" },
  rejected: { icon: "❌", label: "Cadastro rejeitado" },
  expelled: { icon: "🚫", label: "Expulso" },
  archived: { icon: "📦", label: "Arquivado" },
  waiting_registration_review: { icon: "✏️", label: "Revisão cadastral solicitada" },
  revised_registration: { icon: "🔄", label: "Cadastro revisado" },
};

const ROLE_LABELS: Record<string, string> = {
  student: "Aluno", guardian: "Responsável", teacher: "Professor",
  instructor: "Instrutor", owner: "Controlador", assistant: "Assistente",
  supporter: "Apoiador", sponsor: "Patrocinador",
};

const AGE_RANGES = [
  { label: "Kids", min: 0, max: 10 },
  { label: "Infanto Juvenil", min: 11, max: 17 },
  { label: "Adulto", min: 18, max: null as number | null },
];

function calcAge(bd?: string): number | null {
  if (!bd) return null;
  const p = bd.split("/");
  if (p.length !== 3) return null;
  const [d, m, y] = p.map(Number);
  if (!d || !m || !y) return null;
  const dob = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const md = now.getMonth() - dob.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function ageRangeLabel(age: number): string {
  for (const r of AGE_RANGES) {
    if (age >= r.min && (r.max === null || age <= r.max)) return r.label;
  }
  return "";
}

/* ── Main Component ────────────────────────────────────────────────────────── */

export function AccountDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("personal");
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
      alert(err instanceof Error ? err.message : "Erro");
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

  const initials = account.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const statusInfo = STATUS_DISPLAY[account.status] ?? { icon: "❓", label: account.status };

  return (
    <>
      <div className="page-header">
        <Link to="/contas" className="back-link">← Voltar às contas</Link>
      </div>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-avatar">{initials}</div>
        <h2 className="detail-name">{account.name}</h2>
        <p className="detail-email">{account.email}</p>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center", marginTop: "0.5rem" }}>
          {account.roles.map((r) => (
            <span key={r} className="chip">{ROLE_LABELS[r] ?? r}</span>
          ))}
          <span className="status-badge" style={{ color: account.status === "approved" ? "var(--success)" : "var(--gold)", borderColor: account.status === "approved" ? "var(--success)" : "var(--gold)" }}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Action bar */}
      {account.available_actions.length > 0 && (
        <div className="detail-action-bar">
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
      )}

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="detail-tab-content">
        {activeTab === "personal" && <PersonalTab account={account} />}
        {activeTab === "contact" && <ContactTab account={account} />}
        {activeTab === "address" && <AddressTab account={account} />}
        {activeTab === "classes" && <ClassesTab account={account} />}
      </div>
    </>
  );
}

/* ── Tab components ────────────────────────────────────────────────────────── */

function PersonalTab({ account }: { account: Account }) {
  const age = calcAge(account.birth_date);
  const range = age !== null ? ageRangeLabel(age) : "";
  return (
    <div className="review-section-card">
      <Row label="Nome" value={account.name} />
      <Row label="E-mail" value={account.email} />
      <Row label="Nascimento" value={account.birth_date} />
      <Row label="Gênero" value={account.gender === "male" ? "Masculino" : account.gender === "female" ? "Feminino" : undefined} />
      {age !== null && <Row label="Idade" value={`${age} anos`} />}
      {range && <Row label="Faixa etária" value={range} />}
      <Row label="Cadastro" value={account.created_at?.split("T")[0]} />
      {account.is_dependent && <Row label="Dependente" value="Sim" />}
      {account.guardian_uid && <Row label="Responsável (UID)" value={account.guardian_uid} />}
    </div>
  );
}

function ContactTab({ account }: { account: Account }) {
  return (
    <div className="review-section-card">
      <Row label="Celular" value={account.phone} />
      <Row label="WhatsApp" value={account.whatsapp} />
    </div>
  );
}

function AddressTab({ account }: { account: Account }) {
  const a = account.address;
  return (
    <div className="review-section-card">
      <Row label="CEP" value={a?.postal_code} />
      <Row label="Logradouro" value={a?.street} />
      <Row label="Número" value={a?.number} />
      <Row label="Complemento" value={a?.complement} />
      <Row label="Bairro" value={a?.neighborhood} />
      <Row label="Cidade" value={a?.city} />
      <Row label="UF" value={a?.state} />
    </div>
  );
}

function ClassesTab({ account }: { account: Account }) {
  if (account.class_names.length === 0) {
    return (
      <div className="hub-empty" style={{ padding: "2rem" }}>
        <div style={{ fontSize: "1.5rem" }}>🥋</div>
        <p>Nenhuma turma vinculada</p>
      </div>
    );
  }
  return (
    <div className="review-section-card">
      {account.class_names.map((name, i) => (
        <Row key={i} label={`Turma ${i + 1}`} value={name} />
      ))}
    </div>
  );
}

/* ── Shared ────────────────────────────────────────────────────────────────── */

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="review-row">
      <span className="review-row-label">{label}</span>
      <span className="review-row-value">{value || "—"}</span>
    </div>
  );
}
