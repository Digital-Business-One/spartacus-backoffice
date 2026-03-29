import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { signOut, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

import { useProjects } from "../hooks/useProjects";

interface TopBarProps {
  user: User;
  onToggleSidebar: () => void;
}

export function TopBar({ user, onToggleSidebar }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { selected: selectedProject, projects, selectProject } = useProjects();
  const [projectDropdown, setProjectDropdown] = useState(false);
  const projectRef = useRef<HTMLDivElement>(null);

  const initials = (user.displayName ?? user.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (!menuOpen && !projectDropdown) return;
    function handle(e: MouseEvent) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (projectDropdown && projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setProjectDropdown(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen, projectDropdown]);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-hamburger" onClick={onToggleSidebar} aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Link to="/" className="topbar-brand-link">
          <img src="/logo.png" alt="Spartacus" className="logo-circle--sm" />
          <span className="topbar-logo">Spartacus</span>
        </Link>
      </div>

      {selectedProject && (
        <div className="project-selector" ref={projectRef}>
          <button
            className="project-selector-btn"
            onClick={() => { if (projects.length > 1) setProjectDropdown(!projectDropdown); }}
            style={projects.length <= 1 ? { cursor: "default" } : undefined}
          >
            <div className="project-selector-info">
              <span className="project-selector-name">{selectedProject.name}</span>
              {selectedProject.city && (
                <span className="project-selector-city">{selectedProject.city}</span>
              )}
            </div>
            <svg className="project-selector-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {projectDropdown && projects.length > 1 && (
            <div className="project-dropdown">
              {projects.map((p) => (
                <button
                  key={p.id}
                  className={`project-dropdown-item ${p.id === selectedProject.id ? "selected" : ""}`}
                  onClick={() => { selectProject(p.id); setProjectDropdown(false); }}
                >
                  <div className="project-dropdown-item-info">
                    <span className="project-dropdown-item-name">{p.name}</span>
                    {p.city && <span className="project-dropdown-item-city">{p.city}</span>}
                  </div>
                  {p.id === selectedProject.id && <span className="project-dropdown-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="topbar-user" ref={menuRef}>
        <button className="topbar-avatar" onClick={() => setMenuOpen(!menuOpen)}>
          {initials}
        </button>
        {menuOpen && (
          <div className="topbar-menu">
            <div className="topbar-menu-info">
              <div className="topbar-menu-name">{user.displayName ?? "Usuário"}</div>
              <div className="topbar-menu-email">{user.email}</div>
            </div>
            <button className="topbar-menu-item" onClick={() => signOut(auth)}>
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
