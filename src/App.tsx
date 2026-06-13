import { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./lib/firebase";
import { api } from "./lib/api";
import { LoginPage } from "./pages/LoginPage";
import { CreateAccountPage } from "./pages/CreateAccountPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { PendingEmailPage } from "./pages/PendingEmailPage";
import { BlockedStatusPage } from "./pages/BlockedStatusPage";
import { Layout } from "./components/Layout";
import { ProjectHubPage } from "./pages/ProjectHubPage";
import { AccountsPage } from "./pages/AccountsPage";
import { AccountDetailPage } from "./pages/AccountDetailPage";
import { BlockedAccountsPage } from "./pages/BlockedAccountsPage";
import { StudentsPage } from "./pages/StudentsPage";
import { SupportPage } from "./pages/SupportPage";
import { StaffPage } from "./pages/StaffPage";
import { EvaluationPage } from "./pages/EvaluationPage";
import { FrequenciaPage } from "./pages/FrequenciaPage";
import { DoacoesPage } from "./pages/DoacoesPage";
import { GraduacoesPage } from "./pages/GraduacoesPage";
import { IAMPage } from "./pages/IAMPage";
import { ProjectSettingsPage } from "./pages/ProjectSettingsPage";
import { ClassWizardPage } from "./pages/ClassWizardPage";

type AppState = "loading" | "auth" | "email_pending" | "blocked" | "approved";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>("loading");
  const [accountStatus, setAccountStatus] = useState("");

  const checkApproval = useCallback(async () => {
    try {
      const res = await api.get<{ approvalStatus: string }>("/auth/me");
      const status = res.approvalStatus;
      setAccountStatus(status);
      if (status === "approved") {
        setAppState("approved");
      } else {
        // Account exists but not approved — check if email needs verification
        const fbUser = auth.currentUser;
        if (fbUser && !fbUser.emailVerified && fbUser.providerData[0]?.providerId === "password") {
          setAppState("email_pending");
        } else {
          setAppState("blocked");
        }
      }
    } catch {
      setAppState("blocked");
      setAccountStatus("pending_approval");
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setAppState("auth");
      } else {
        checkApproval();
      }
    });
  }, [checkApproval]);

  if (appState === "loading") {
    return (
      <div className="loading-page">
        <h1>Spartacus</h1>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/criar-conta" element={<CreateAccountPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

        {appState === "auth" ? (
          <Route path="*" element={<LoginPage />} />
        ) : appState === "email_pending" ? (
          <Route
            path="*"
            element={
              <PendingEmailPage
                email={user?.email ?? ""}
                onVerified={() => {
                  setAccountStatus("pending_approval");
                  setAppState("blocked");
                }}
              />
            }
          />
        ) : appState === "blocked" ? (
          <Route path="*" element={<BlockedStatusPage status={accountStatus} />} />
        ) : (
          <Route element={<Layout user={user!} />}>
            <Route path="/" element={<ProjectHubPage />} />
            {/* Contas — estrutura nova */}
            <Route path="/onboarding" element={<AccountsPage />} />
            <Route path="/alunos" element={<StudentsPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/apoiadores" element={<SupportPage />} />
            <Route path="/iam" element={<IAMPage />} />
            <Route path="/lixeira" element={<BlockedAccountsPage />} />
            <Route path="/contas/:uid" element={<AccountDetailPage />} />
            {/* Redirects para rotas antigas */}
            <Route path="/em-analise" element={<Navigate to="/onboarding" replace />} />
            <Route path="/bloqueados" element={<Navigate to="/lixeira" replace />} />
            <Route path="/apoio" element={<Navigate to="/apoiadores" replace />} />
            <Route path="/professores" element={<Navigate to="/staff?role=teacher" replace />} />
            <Route path="/instrutores" element={<Navigate to="/staff?role=instructor" replace />} />
            <Route path="/contas" element={<Navigate to="/onboarding" replace />} />
            {/* Módulos */}
            <Route path="/frequencia" element={<FrequenciaPage />} />
            <Route path="/doacoes" element={<DoacoesPage />} />
            <Route path="/graduacoes" element={<GraduacoesPage />} />
            <Route path="/avaliacao" element={<EvaluationPage />} />
            {/* Conta */}
            <Route path="/update-password" element={<ChangePasswordPage />} />
            {/* Configurações */}
            <Route path="/configuracoes" element={<ProjectSettingsPage />} />
            <Route path="/configuracoes/turmas/nova" element={<ClassWizardPage />} />
            <Route path="/configuracoes/turmas/:id/editar" element={<ClassWizardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
