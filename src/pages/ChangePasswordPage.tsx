import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "../lib/firebase";

interface FieldErrors {
  current?: string;
  next?: string;
  confirm?: string;
  general?: string;
}

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const newErrors: FieldErrors = {};
    if (!currentPassword) {
      newErrors.current = "Informe a senha atual";
    }
    if (!newPassword) {
      newErrors.next = "Informe a nova senha";
    } else if (newPassword.length < 6) {
      newErrors.next = "A nova senha deve ter no mínimo 6 caracteres";
    }
    if (!confirmPassword) {
      newErrors.confirm = "Confirme a nova senha";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm = "As senhas não conferem";
    }
    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.next = "A nova senha deve ser diferente da atual";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const user = auth.currentUser;
    if (!user || !user.email) {
      setErrors({ general: "Sessão inválida. Faça login novamente." });
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (
        e.code === "auth/wrong-password" ||
        e.code === "auth/invalid-credential"
      ) {
        setErrors({ current: "Senha atual incorreta" });
      } else if (e.code === "auth/weak-password") {
        setErrors({ next: "Senha muito fraca. Use pelo menos 6 caracteres." });
      } else if (e.code === "auth/requires-recent-login") {
        setErrors({
          general: "Sessão expirada. Faça login novamente para continuar.",
        });
      } else {
        setErrors({ general: "Erro ao alterar senha. Tente novamente." });
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
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
          <h2 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Senha alterada
          </h2>
          <p style={{ color: "var(--text-muted)" }}>
            Sua senha foi atualizada com sucesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.9rem",
            padding: 0,
            marginBottom: "0.5rem",
          }}
        >
          ← Voltar
        </button>
        <h1 style={{ color: "var(--text-primary)", margin: 0 }}>Alterar senha</h1>
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "2rem",
        }}
      >
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
          }}
        >
          Para sua segurança, informe sua senha atual antes de definir uma nova.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Senha atual</label>
            <input
              type="password"
              className="form-input"
              placeholder="Informe sua senha atual"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  current: undefined,
                  general: undefined,
                }));
              }}
              required
            />
            {errors.current && <div className="login-error">{errors.current}</div>}
          </div>

          <div className="form-group">
            <label>Nova senha</label>
            <input
              type="password"
              className="form-input"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors((prev) => ({ ...prev, next: undefined }));
              }}
              required
            />
            {errors.next && <div className="login-error">{errors.next}</div>}
          </div>

          <div className="form-group">
            <label>Confirme a nova senha</label>
            <input
              type="password"
              className="form-input"
              placeholder="Digite a nova senha novamente"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirm: undefined }));
              }}
              required
            />
            {errors.confirm && <div className="login-error">{errors.confirm}</div>}
          </div>

          {errors.general && <div className="login-error">{errors.general}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            {loading ? "Alterando..." : "Alterar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
