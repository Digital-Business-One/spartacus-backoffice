import { Outlet } from "react-router-dom";
import { type User } from "firebase/auth";
import { TopBar } from "./TopBar";
import { useProject } from "../hooks/useProject";

interface LayoutProps {
  user: User;
}

export function Layout({ user }: LayoutProps) {
  const { project } = useProject();

  return (
    <div className="layout-v2">
      <TopBar user={user} projectName={project?.name} />
      <main className="main-content-v2">
        <Outlet />
      </main>
    </div>
  );
}
