import { NavLink, Outlet } from "react-router-dom";
import { signOut, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

interface LayoutProps {
  user: User;
}

export function Layout({ user }: LayoutProps) {
  const initials = (user.displayName ?? user.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div>
            <h1>Spartacus</h1>
            <div className="sidebar-brand-sub">Backoffice</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/contas" className={({ isActive }) => isActive ? "active" : ""}>
            <span className="sidebar-nav-icon">📋</span>
            Contas
          </NavLink>
          <NavLink to="/alunos" className={({ isActive }) => isActive ? "active" : ""}>
            <span className="sidebar-nav-icon">🥋</span>
            Alunos
          </NavLink>
          <NavLink to="/metodologia" className={({ isActive }) => isActive ? "active" : ""}>
            <span className="sidebar-nav-icon">📚</span>
            Metodologia
          </NavLink>
          <NavLink to="/calendario" className={({ isActive }) => isActive ? "active" : ""}>
            <span className="sidebar-nav-icon">📅</span>
            Calendário
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-user-name">{user.displayName ?? "Usuário"}</div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
          </div>
          <button
            className="btn btn-outline btn-sm"
            style={{ width: "100%" }}
            onClick={() => signOut(auth)}
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
