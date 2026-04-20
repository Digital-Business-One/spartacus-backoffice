import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const PROJECT_ID =
  import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "spartacus-artes-marciais";

interface Props {
  email: string;
  onVerified: () => void;
}

export function PendingEmailPage({ email, onVerified }: Props) {
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  async function handleResend() {
    setResending(true);
    setMessage(null);
    try {
      const res = await fetch(`${BASE_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Project-Id": PROJECT_ID,
        },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setMessage({ text: "Novo e-mail enviado com sucesso.", error: false });
      } else {
        setMessage({ text: "Não foi possível reenviar. Tente novamente.", error: true });
      }
    } catch {
      setMessage({ text: "Erro de conexão. Verifique sua internet.", error: true });
    } finally {
      setResending(false);
    }
  }

  async function handleConfirm() {
    setVerifying(true);
    setMessage(null);
    try {
      await api.post("/auth/email-verified", {});
      onVerified();
    } catch {
      setMessage({
        text: "E-mail ainda não confirmado. Clique no link enviado para seu e-mail.",
        error: true,
      });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div className="login-brand">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✉️</div>
          <h1>Confirme seu e-mail</h1>
          <p>Validação pendente</p>
        </div>

        <p style={{ color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6, marginBottom: "0.5rem" }}>
          Enviamos um link de confirmação para:
        </p>
        <p style={{ color: "var(--gold)", textAlign: "center", fontWeight: 600, fontSize: "1.1rem", marginBottom: "1rem" }}>
          {email}
        </p>
        <p style={{ color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          Clique no link no e-mail e depois clique em "Já confirmei" abaixo.
        </p>

        {message && (
          <div className={message.error ? "login-error" : "login-success"} style={{ marginBottom: "1rem" }}>
            {message.text}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={verifying}>
            {verifying ? "Verificando..." : "Já confirmei meu e-mail"}
          </button>
          <button className="btn btn-outline" onClick={handleResend} disabled={resending}>
            {resending ? "Enviando..." : "Reenviar e-mail"}
          </button>
          <button className="btn btn-outline" onClick={() => signOut(auth)}>
            Voltar ao login
          </button>
        </div>
      </div>
    </div>
  );
}
