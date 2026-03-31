import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "spartacus-artes-marciais";
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface ClassData {
  id: string;
  name: string;
  modality: string;
  schedule: string;
  teacher?: string;
  age_range?: { min: number; max?: number };
  icon_url?: string;
}

export function useClasses() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      // Public endpoint — use direct fetch to avoid CORS issues during signup
      const res = await fetch(`${BASE_URL}/projects/${PROJECT_ID}/classes`);
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const createClass = useCallback(async (data: {
    id: string;
    name: string;
    modality: string;
    weekly_schedule: { days: string[]; start_time: string; end_time: string };
    teacher_name?: string;
    age_range?: { min: number; max?: number };
  }) => {
    const result = await api.post<ClassData>(`/projects/${PROJECT_ID}/classes`, data);
    await fetchClasses();
    return result;
  }, [fetchClasses]);

  const updateClass = useCallback(async (classId: string, data: Record<string, unknown>) => {
    const result = await api.patch<ClassData>(`/projects/${PROJECT_ID}/classes/${classId}`, data);
    await fetchClasses();
    return result;
  }, [fetchClasses]);

  const deactivateClass = useCallback(async (classId: string) => {
    await api.delete(`/projects/${PROJECT_ID}/classes/${classId}`);
    await fetchClasses();
  }, [fetchClasses]);

  return { classes, loading, refetch: fetchClasses, createClass, updateClass, deactivateClass };
}
