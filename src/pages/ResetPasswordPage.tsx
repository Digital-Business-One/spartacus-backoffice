import { useState, useEffect, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "../lib/firebase";

type Screen = "verifying" | "form" | "success" | "invalid";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode") ?? "";
  const mode = searchParams.get("mode") ?? "";

  const [screen, setScreen] = useState<Screen>("verifying");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      setScreen("invalid");
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((resolvedEmail) => {
        setEmail(resolvedEmail);
        setScreen("form");
      })
      .catch(() => {
        setScreen("invalid");
      });
  }, [mode, oobCode]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setScreen("success");
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "auth/expired-action-code") {
        setError("O link expirou. Solicite um novo.");
      } else if (e.code === "auth/invalid-action-code") {
        setError("Link inválido. Solicite um novo.");
      } else if (e.code === "auth/weak-password") {
        setError("Senha muito fraca. Use pelo menos 6 caracteres.");
      } else {
        setError("Erro ao redefinir senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (screen === "verifying") {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <h1>Verificando link...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "invalid") {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                background: "rgba(231,76,76,0.12)",
                border: "2px solid rgba(231,76,76,0.3)",
                margin: "0 auto 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
              }}
            >
              ⚠
            </div>
            <h1>Link inválido</h1>
            <p>Este link de recuperação é inválido ou já expirou.</p>
          </div>
          <Link
            to="/esqueci-senha"
            className="btn btn-primary"
            style={{ width: "100%", textDecoration: "none", textAlign: "center" }}
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  if (screen === "success") {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                background: "rgba(76,175,80,0.12)",
                border: "2px solid rgba(76,175,80,0.3)",
                margin: "0 auto 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
                color: "var(--success)",
              }}
            >
              ✓
            </div>
            <h1>Senha redefinida</h1>
            <p>Sua senha foi alterada com sucesso. Você já pode entrar com a nova senha.</p>
          </div>
          <Link
            to="/"
            className="btn btn-primary"
            style={{ width: "100%", textDecoration: "none", textAlign: "center" }}
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <h1>Nova senha</h1>
          <p>
            Crie uma nova senha para <strong style={{ color: "var(--gold)" }}>{email}</strong>
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nova senha</label>
            <input
              type="password"
              className="form-input"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirme a nova senha</label>
            <input
              type="password"
              className="form-input"
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !password || !confirmPassword}
          >
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
