import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export function PendingApprovalPage() {
  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div className="login-brand">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
          <h1>Conta em análise</h1>
          <p>Aguardando aprovação</p>
        </div>

        <p style={{ color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          Suas informações foram enviadas com sucesso e estão sendo analisadas
          pela equipe do Spartacus. Você receberá uma notificação quando sua conta
          for aprovada.
        </p>

        <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: "1.5rem" }}>
          <StatusRow icon="✅" label="Dados enviados" done />
          <StatusRow icon="✅" label="E-mail confirmado" done />
          <StatusRow icon="⏳" label="Revisão pela equipe" active />
          <StatusRow icon="🔒" label="Conta ativada" />
        </div>

        <button className="btn btn-outline" style={{ width: "100%" }} onClick={() => signOut(auth)}>
          Voltar ao login
        </button>
      </div>
    </div>
  );
}

function StatusRow({ icon, label, done, active }: { icon: string; label: string; done?: boolean; active?: boolean }) {
  const color = done ? "var(--text-primary)" : active ? "var(--gold)" : "var(--text-muted)";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "0.75rem 1rem",
      borderBottom: "1px solid var(--border)",
      color,
    }}>
      <span>{icon}</span>
      <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 500 }}>{label}</span>
      {active && <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--gold)" }} />}
    </div>
  );
}
