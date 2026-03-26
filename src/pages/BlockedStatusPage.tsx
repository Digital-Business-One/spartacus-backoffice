import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

const STATUS_CONFIG: Record<string, { icon: string; title: string; message: string }> = {
  pending_approval: {
    icon: "⏳",
    title: "Conta em análise",
    message: "Suas informações estão sendo analisadas pela equipe do Spartacus. Você receberá uma notificação quando sua conta for aprovada.",
  },
  waiting_medical_history: {
    icon: "📋",
    title: "Preencha a anamnese",
    message: "Sua conta foi aprovada! Agora é necessário preencher a ficha de anamnese (histórico médico) para completar o cadastro.",
  },
  pending_medical_history_approval: {
    icon: "⏳",
    title: "Anamnese em revisão",
    message: "Sua ficha de anamnese foi enviada e está sendo analisada pela equipe. Você será notificado quando for aprovada.",
  },
  waiting_registration_review: {
    icon: "✏️",
    title: "Revisão cadastral solicitada",
    message: "A equipe do Spartacus solicitou uma revisão nos seus dados cadastrais. Por favor, acesse o app para revisar e reenviar.",
  },
  revised_registration: {
    icon: "⏳",
    title: "Revisão em análise",
    message: "Seus dados revisados foram enviados e estão sendo reavaliados pela equipe.",
  },
  rejected: {
    icon: "❌",
    title: "Cadastro não aprovado",
    message: "Infelizmente seu cadastro não foi aprovado pela equipe do Spartacus. Entre em contato para mais informações.",
  },
  expelled: {
    icon: "🚫",
    title: "Conta suspensa",
    message: "Sua conta foi suspensa. Entre em contato com a equipe do Spartacus para mais informações.",
  },
  archived: {
    icon: "📦",
    title: "Conta arquivada",
    message: "Sua conta foi arquivada. Entre em contato com a equipe para reativar.",
  },
};

export function BlockedStatusPage({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending_approval;

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div className="login-brand">
          <img src="/logo.png" alt="Spartacus" className="logo-circle" style={{ margin: "0 auto 1rem", display: "block" }} />
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{config.icon}</div>
          <h1 style={{ fontSize: "1.3rem" }}>{config.title}</h1>
        </div>

        <p style={{ color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          {config.message}
        </p>

        <div className="notice" style={{ marginBottom: "1.5rem" }}>
          <span>ℹ️</span>
          <span>Status atual: <strong style={{ color: "var(--gold)" }}>{status.replace(/_/g, " ")}</strong></span>
        </div>

        <button className="btn btn-outline" style={{ width: "100%" }} onClick={() => signOut(auth)}>
          Voltar ao login
        </button>
      </div>
    </div>
  );
}
