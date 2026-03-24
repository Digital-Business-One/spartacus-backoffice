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
import { PendingApprovalPage } from "./pages/PendingApprovalPage";
import { Layout } from "./components/Layout";
import { AccountsPage } from "./pages/AccountsPage";
import { StudentsPage } from "./pages/StudentsPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { CalendarPage } from "./pages/CalendarPage";

type AppState = "loading" | "auth" | "pending_email" | "pending_approval" | "approved";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>("loading");

  const checkApproval = useCallback(async () => {
    try {
      const res = await api.get<{ approvalStatus: string }>("/auth/me");
      if (res.approvalStatus === "approved") {
        setAppState("approved");
      } else if (res.approvalStatus === "pending_email") {
        setAppState("pending_email");
      } else {
        setAppState("pending_approval");
      }
    } catch {
      setAppState("pending_approval");
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
        ) : appState === "pending_email" ? (
          <Route
            path="*"
            element={
              <PendingEmailPage
                email={user?.email ?? ""}
                onVerified={() => setAppState("pending_approval")}
              />
            }
          />
        ) : appState === "pending_approval" ? (
          <Route path="*" element={<PendingApprovalPage />} />
        ) : (
          <Route element={<Layout user={user!} />}>
            <Route path="/contas" element={<AccountsPage />} />
            <Route path="/contas/nova" element={<CreateAccountPage />} />
            <Route path="/alunos" element={<StudentsPage />} />
            <Route path="/metodologia" element={<MethodologyPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="*" element={<Navigate to="/contas" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
