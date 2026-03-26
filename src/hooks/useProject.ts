import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "spartacus-artes-marciais";

export interface ProjectData {
  id: string;
  name: string;
  razao_social?: string;
  cnpj?: string;
  logo_url?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  legal_nature?: string;
  founded_at?: string;
  is_root: boolean;
  created_at: string;
}

export function useProject() {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(() => {
    setLoading(true);
    api.get<ProjectData>(`/projects/${PROJECT_ID}`)
      .then(setProject)
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const updateProject = useCallback(async (data: Partial<ProjectData>) => {
    const updated = await api.patch<ProjectData>(`/projects/${PROJECT_ID}`, data);
    setProject(updated);
    return updated;
  }, []);

  return { project, loading, updateProject, refetch: fetchProject };
}
