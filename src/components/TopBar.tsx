import { useState, useRef, useEffect } from "react";
import { signOut, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

interface TopBarProps {
  user: User;
  projectName?: string;
}

export function TopBar({ user, projectName }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = (user.displayName ?? user.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-logo">Spartacus</span>
      </div>

      {projectName && (
        <div className="topbar-project">
          {projectName}
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
