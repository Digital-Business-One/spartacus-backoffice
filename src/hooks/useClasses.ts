import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "spartacus-artes-marciais";
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface ClassData {
  id: string;
  name: string;
  modality_id: string;
  modality_name: string;
  schedule: string;
  schedule_items: { day: string; start_time: string; end_time: string }[];
  teacher?: string;
  location?: string;
  age_range?: { min: number; max?: number };
  icon_url?: string;
  active?: boolean;
  student_count?: number;
  // Attendance engine (Frequência Analítica) — camelCase in the JSON payload,
  // matching the backend's explicit aliases (see app/models/classes.py).
  attendanceEngineEnabled?: boolean;
  attendanceStartDate?: string | null;
}

export function useClasses() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      // Public endpoint — use direct fetch to avoid CORS issues during signup.
      // no-store bypasses browser cache so deletes/updates reflect immediately.
      const res = await fetch(
        `${BASE_URL}/projects/${PROJECT_ID}/classes?includeInactive=true`,
        { cache: "no-store" },
      );
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
    modality_id: string;
    schedule: { day: string; start_time: string; end_time: string }[];
    teacher_name?: string;
    location?: string;
    age_range?: { min: number; max?: number };
    attendanceEngineEnabled?: boolean;
    attendanceStartDate?: string;
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
    const result = await api.delete<{ status: "deleted" | "deactivated" }>(
      `/projects/${PROJECT_ID}/classes/${classId}`,
    );
    await fetchClasses();
    return result?.status ?? "deleted";
  }, [fetchClasses]);

  const reactivateClass = useCallback(async (classId: string) => {
    await api.post(
      `/projects/${PROJECT_ID}/classes/${classId}/reactivate`,
      {},
    );
    await fetchClasses();
  }, [fetchClasses]);

  return {
    classes,
    loading,
    refetch: fetchClasses,
    createClass,
    updateClass,
    deactivateClass,
    reactivateClass,
  };
}
