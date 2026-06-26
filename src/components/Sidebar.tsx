import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavChild {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  icon: React.ReactNode;
  label: string;
  children: NavChild[];
}

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

// ── SVG icons (stroke-only, inherit currentColor) ───────────────────────────

const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const Icons = {
  dashboard: (
    <Svg>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </Svg>
  ),
  users: (
    <Svg>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </Svg>
  ),
  calendar: (
    <Svg>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
  ),
  clipboard: (
    <Svg>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </Svg>
  ),
  barChart: (
    <Svg>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </Svg>
  ),
  settings: (
    <Svg>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </Svg>
  ),
  // Child icons
  attendance: (
    <Svg>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <polyline points="9 14 11 16 15 12" />
    </Svg>
  ),
  tasks: (
    <Svg>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <polyline points="3 6 4 7 6 5" />
      <polyline points="3 12 4 13 6 11" />
      <polyline points="3 18 4 19 6 17" />
    </Svg>
  ),
  userCheck: (
    <Svg>
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </Svg>
  ),
  userX: (
    <Svg>
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" />
      <line x1="23" y1="8" x2="18" y2="13" />
    </Svg>
  ),
  graduationCap: (
    <Svg>
      <path d="M22 10L12 4 2 10l10 6 10-6z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </Svg>
  ),
  bookOpen: (
    <Svg>
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </Svg>
  ),
  activity: (
    <Svg>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </Svg>
  ),
  heart: (
    <Svg>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </Svg>
  ),
  shield: (
    <Svg>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  ),
  award: (
    <Svg>
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </Svg>
  ),
  bookClass: (
    <Svg>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </Svg>
  ),
};

// ── Navigation data ─────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    icon: Icons.dashboard,
    label: "Dashboards",
    children: [
      { to: "/frequencia", label: "Frequência", icon: Icons.attendance },
      { to: "/apoio", label: "Apoio", icon: Icons.heart },
      { to: "/graduacoes", label: "Graduações", icon: Icons.award },
      { to: "/calendario", label: "Calendário", icon: Icons.attendance },
      { to: "/ficha-saude", label: "Ficha de saúde", icon: Icons.clipboard },
    ],
  },
  {
    icon: Icons.users,
    label: "Contas",
    children: [
      { to: "/onboarding", label: "Matrícula", icon: Icons.userCheck },
      { to: "/alunos", label: "Alunos", icon: Icons.graduationCap },
      { to: "/staff", label: "Staff", icon: Icons.bookOpen },
      { to: "/apoiadores", label: "Apoiadores", icon: Icons.heart },
      { to: "/iam", label: "Segurança", icon: Icons.shield },
      { to: "/lixeira", label: "Lixeira", icon: Icons.userX },
    ],
  },
];

const NAV_ITEMS: NavItem[] = [
  { to: "/avaliacao", icon: Icons.clipboard, label: "Avaliação" },
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
            <SidebarGroup
              key={group.label}
              group={group}
              pathname={location.pathname}
              onNavigate={closeMobile}
            />
          ))}

          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-item sidebar-top ${isActive ? "active" : ""}`
              }
              onClick={closeMobile}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label sidebar-item-label--upper">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              `sidebar-item sidebar-settings ${isActive ? "active" : ""}`
            }
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
        className={`sidebar-item sidebar-top sidebar-group-toggle ${
          isChildActive ? "active" : ""
        }`}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="sidebar-item-icon">{group.icon}</span>
        <span className="sidebar-item-label sidebar-item-label--upper">
          {group.label}
        </span>
        <span
          className={`sidebar-chevron ${
            expanded ? "sidebar-chevron--open" : ""
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
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
              className={({ isActive }) =>
                `sidebar-item sidebar-child ${isActive ? "active" : ""}`
              }
              onClick={onNavigate}
            >
              <span className="sidebar-item-icon sidebar-child-icon">
                {child.icon}
              </span>
              <span className="sidebar-item-label">{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
