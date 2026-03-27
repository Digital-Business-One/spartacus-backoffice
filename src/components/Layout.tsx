import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { type User } from "firebase/auth";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  user: User;
}

function getDefaultSidebarState(): boolean {
  const stored = localStorage.getItem("sidebar-open");
  if (stored !== null) return JSON.parse(stored);
  return window.innerWidth >= 768;
}

export function Layout({ user }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(getDefaultSidebarState);

  useEffect(() => {
    localStorage.setItem("sidebar-open", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Auto-collapse on mobile resize
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768) setSidebarOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="layout-v2">
      <TopBar
        user={user}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`main-content-v2 ${sidebarOpen ? "main-content-v2--with-sidebar" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
