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
import { PendingEmailPage } from "./pages/PendingEmailPage";
import { BlockedStatusPage } from "./pages/BlockedStatusPage";
import { Layout } from "./components/Layout";
import { ProjectHubPage } from "./pages/ProjectHubPage";
import { AccountsPage } from "./pages/AccountsPage";
import { AccountDetailPage } from "./pages/AccountDetailPage";
import { StudentsPage } from "./pages/StudentsPage";
import { ProjectSettingsPage } from "./pages/ProjectSettingsPage";
import { ClassWizardPage } from "./pages/ClassWizardPage";

const APPROVED_STATE = "approved";
const EMAIL_PENDING = "waiting_email_confirmation";

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
      if (status === APPROVED_STATE) {
        setAppState("approved");
      } else if (status === EMAIL_PENDING) {
        setAppState("email_pending");
      } else {
        setAppState("blocked");
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
        {/* Public route — self-registration */}
        <Route path="/criar-conta" element={<CreateAccountPage />} />

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
            <Route path="/contas" element={<AccountsPage />} />
            <Route path="/contas/:uid" element={<AccountDetailPage />} />
            <Route path="/contas/nova" element={<CreateAccountPage />} />
            <Route path="/alunos" element={<StudentsPage />} />
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
