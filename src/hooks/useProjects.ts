import { useState, useEffect } from "react";
import { api } from "../lib/api";

export interface MyProject {
  id: string;
  name: string;
  city?: string;
  logo_url?: string;
  roles: string[];
}

export function useProjects() {
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(() =>
    localStorage.getItem("selected-project") ?? ""
  );

  useEffect(() => {
    api.get<MyProject[]>("/me/projects")
      .then((list) => {
        setProjects(list);
        // Auto-select if 1 project (ADR-14 §6.3)
        if (list.length === 1 && !selectedId) {
          setSelectedId(list[0].id);
          localStorage.setItem("selected-project", list[0].id);
        }
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectProject(id: string) {
    setSelectedId(id);
    localStorage.setItem("selected-project", id);
  }

  const selected = projects.find((p) => p.id === selectedId) ?? projects[0] ?? null;

  return { projects, loading, selected, selectProject };
}
