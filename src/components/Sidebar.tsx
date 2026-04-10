import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavGroup {
  icon: React.ReactNode;
  label: string;
  children: { to: string; label: string }[];
}

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

// ── SVG Icons (stroke-only, inherit currentColor) ───────────────────────────

const icon = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  clipboard: icon("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"),
  barChart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
};

// ── Navigation data ─────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    icon: Icons.users,
    label: "Contas",
    children: [
      { to: "/em-analise", label: "Em análise" },
      { to: "/bloqueados", label: "Bloqueados" },
      { to: "/alunos", label: "Alunos" },
      { to: "/professores", label: "Professores" },
      { to: "/instrutores", label: "Instrutores" },
      { to: "/apoio", label: "Apoio" },
      { to: "/iam", label: "Segurança" },
    ],
  },
  {
    icon: Icons.calendar,
    label: "Calendário",
    children: [
      { to: "/eventos", label: "Eventos" },
      { to: "/aulas", label: "Aulas" },
    ],
  },
];

const NAV_ITEMS: NavItem[] = [
  { to: "/avaliacao", icon: Icons.clipboard, label: "Avaliação" },
  { to: "/relatorios", icon: Icons.barChart, label: "Relatórios" },
];

// ── Component ───────────────────────────────────────────────────────────────

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();

  function closeMobile() {
    if (window.innerWidth < 768) onClose();
  }

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? "" : "sidebar--closed"}`}>
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.label} group={group} pathname={location.pathname} onNavigate={closeMobile} />
          ))}

          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
              onClick={closeMobile}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/configuracoes"
            className={({ isActive }) => `sidebar-item sidebar-settings ${isActive ? "active" : ""}`}
            onClick={closeMobile}
          >
            <span className="sidebar-item-icon">{Icons.settings}</span>
            <span className="sidebar-item-label">Configurações</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}

function SidebarGroup({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate: () => void;
}) {
  const isChildActive = group.children.some((c) => pathname.startsWith(c.to));
  const [expanded, setExpanded] = useState(isChildActive);

  return (
    <div className="sidebar-group">
      <button
        className={`sidebar-item sidebar-group-toggle ${isChildActive ? "active" : ""}`}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="sidebar-item-icon">{group.icon}</span>
        <span className="sidebar-item-label">{group.label}</span>
        <span className={`sidebar-chevron ${expanded ? "sidebar-chevron--open" : ""}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="sidebar-children">
          {group.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) => `sidebar-item sidebar-child ${isActive ? "active" : ""}`}
              onClick={onNavigate}
            >
              <span className="sidebar-item-label">{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
