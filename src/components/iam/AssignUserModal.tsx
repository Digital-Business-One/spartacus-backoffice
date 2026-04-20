import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { AccountAvatar } from "../account/AccountAvatar";
import { calcAge } from "../account/types";

interface EligibleUser {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  photo_url?: string | null;
  birthDate?: string | null;
  birth_date?: string | null;
  roles: string[];
}

interface AssignUserModalProps {
  open: boolean;
  roleCode: string;
  roleLabel: string;
  projectId: string;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignUserModal({
  open,
  roleCode,
  roleLabel,
  projectId,
  onClose,
  onAssigned,
}: AssignUserModalProps) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<EligibleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected(new Set());
      setUsers([]);
      return;
    }
    fetchEligible("");
  }, [open, roleCode]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => fetchEligible(search), 300);
    return () => clearTimeout(timer);
  }, [search, open]);

  async function fetchEligible(q: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: roleCode });
      if (q) params.set("search", q);
      const result = await api.get<EligibleUser[]>(
        `/projects/${projectId}/members/eligible?${params}`,
      );
      setUsers(result);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleUser(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function handleAssign() {
    if (selected.size === 0) return;
    setAssigning(true);
    try {
      await api.post(`/projects/${projectId}/members/assign-role`, {
        role: roleCode,
        user_ids: [...selected],
      });
      onAssigned();
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao atribuir");
    } finally {
      setAssigning(false);
    }
  }

  if (!open) return null;

  return (
    <div className="iam-modal-overlay" onClick={onClose}>
      <div className="iam-modal" onClick={(e) => e.stopPropagation()}>
        <div className="iam-modal-header">
          <div>
            <h3 className="iam-modal-title">Atribuir usuário</h3>
            <div className="iam-modal-subtitle">Perfil: {roleLabel}</div>
          </div>
          <button className="iam-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="iam-modal-search">
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="iam-modal-list">
          {loading ? (
            <div className="iam-modal-loading">Carregando...</div>
          ) : users.length === 0 ? (
            <div className="iam-modal-empty">
              Nenhum usuário elegível encontrado.
            </div>
          ) : (
            users.map((u) => {
              const isSelected = selected.has(u.uid);
              const photoUrl = u.photoUrl ?? u.photo_url ?? null;
              const birthDate = u.birthDate ?? u.birth_date ?? null;
              const age = calcAge(birthDate);
              return (
                <div
                  key={u.uid}
                  className={`iam-modal-user ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleUser(u.uid)}
                >
                  <AccountAvatar
                    name={u.name}
                    photoUrl={photoUrl}
                    size="sm"
                  />
                  <div className="iam-modal-user-info">
                    <div className="iam-modal-user-name">{u.name}</div>
                    <div className="iam-modal-user-meta">
                      {u.email}
                      {age !== null && <span> · {age} anos</span>}
                    </div>
                  </div>
                  <div className="iam-modal-check">
                    {isSelected ? "✓" : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="iam-modal-footer">
          <span className="iam-modal-count">
            {selected.size > 0
              ? `${selected.size} selecionado${selected.size > 1 ? "s" : ""}`
              : ""}
          </span>
          <button className="btn btn-sm btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={handleAssign}
            disabled={selected.size === 0 || assigning}
          >
            {assigning
              ? "..."
              : `Atribuir${selected.size > 0 ? ` (${selected.size})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
