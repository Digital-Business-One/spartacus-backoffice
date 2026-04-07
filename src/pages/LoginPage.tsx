import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Email ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setError("Falha ao entrar com Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img src="/logo.png" alt="Spartacus" className="logo-circle--lg" style={{ margin: "0 auto 1rem", display: "block" }} />
          <h1>Spartacus</h1>
          <p>Backoffice</p>
        </div>

        <form className="login-form" onSubmit={handleEmailLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              className="form-input"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <Link
              to="/esqueci-senha"
              style={{
                color: "var(--gold)",
                fontSize: "0.85rem",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Esqueceu a senha?
            </Link>
          </div>
        </form>

        <div className="login-divider">ou</div>

        <button
          className="btn btn-outline"
          style={{ width: "100%" }}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <span style={{ fontSize: "1.1rem" }}>G</span>
          Entrar com Google
        </button>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Ainda não tem conta? </span>
          <a href="/criar-conta" style={{ color: "var(--gold)", fontSize: "0.85rem", textDecoration: "none", fontWeight: 600 }}>
            Criar conta
          </a>
        </div>
      </div>
    </div>
  );
}
