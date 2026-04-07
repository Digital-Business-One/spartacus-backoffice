import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "auth/user-not-found") {
        setError("E-mail não encontrado em nossa base.");
      } else if (e.code === "auth/invalid-email") {
        setError("E-mail inválido.");
      } else {
        setError("Erro ao enviar link. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                background: "var(--gold-muted)",
                border: "2px solid rgba(198,163,78,0.3)",
                margin: "0 auto 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
              }}
            >
              ✉
            </div>
            <h1>E-mail enviado</h1>
          </div>

          <p
            style={{
              color: "var(--text-primary)",
              textAlign: "center",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              marginBottom: "0.5rem",
            }}
          >
            Enviamos um link de recuperação para
            <br />
            <strong style={{ color: "var(--gold)" }}>{email}</strong>
          </p>
          <p
            style={{
              color: "var(--text-muted)",
              textAlign: "center",
              fontSize: "0.85rem",
              lineHeight: 1.6,
              marginBottom: "1.5rem",
            }}
          >
            Verifique sua caixa de entrada (e a pasta de spam) e clique no link
            para criar uma nova senha.
          </p>

          <Link to="/" className="btn btn-primary" style={{ width: "100%", textDecoration: "none", textAlign: "center" }}>
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              background: "var(--gold-muted)",
              border: "2px solid rgba(198,163,78,0.3)",
              margin: "0 auto 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
            }}
          >
            🔒
          </div>
          <h1>Esqueceu a senha?</h1>
          <p>Informe seu e-mail e enviaremos um link para criar uma nova senha</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !email.trim()}
          >
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link
            to="/"
            style={{
              color: "var(--gold)",
              fontSize: "0.85rem",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
