import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { RoleList } from "../components/iam/RoleList";
import { RoleDetail } from "../components/iam/RoleDetail";
import { RoleUsers } from "../components/iam/RoleUsers";
import { UserDetailPanel } from "../components/iam/UserDetailPanel";
import { AssignUserModal } from "../components/iam/AssignUserModal";
import { ROLES, findRole } from "../components/iam/roles";

const PROJECT_ID =
  import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "spartacus-artes-marciais";

type View =
  | { step: "empty" }
  | { step: "role"; role: string }
  | { step: "users"; role: string }
  | { step: "user-detail"; role: string; uid: string };

interface AccountItem {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  photo_url?: string | null;
  birthDate?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  roles: string[];
  status: string;
}

interface AccountPage {
  items: AccountItem[];
  total: number;
}

export function IAMPage() {
  const [view, setView] = useState<View>({ step: "empty" });
  const [allMembers, setAllMembers] = useState<
    { userId: string; roles: string[] }[]
  >([]);
  const [roleUsers, setRoleUsers] = useState<AccountItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  // Fetch all memberships for user counts
  const fetchMembers = useCallback(async () => {
    try {
      const members = await api.get<
        { userId: string; roles: string[] }[]
      >(`/projects/${PROJECT_ID}/members`);
      setAllMembers(members);
    } catch {
      setAllMembers([]);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // User counts per role
  const userCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of ROLES) counts[r.code] = 0;
    for (const m of allMembers) {
      for (const role of m.roles) {
        counts[role] = (counts[role] ?? 0) + 1;
      }
    }
    return counts;
  }, [allMembers]);

  // Fetch users for the selected role
  const fetchRoleUsers = useCallback(async (role: string) => {
    setUsersLoading(true);
    try {
      const res = await api.get<AccountPage>(
        `/accounts?role=${role}&status=approved&pageSize=50`,
      );
      setRoleUsers(res.items ?? []);
    } catch {
      setRoleUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  function selectRole(code: string) {
    setView({ step: "role", role: code });
  }

  function showUsers() {
    if (view.step === "empty") return;
    const role = "role" in view ? view.role : "";
    setView({ step: "users", role });
    fetchRoleUsers(role);
  }

  function selectUser(uid: string) {
    if (view.step !== "users") return;
    setView({ step: "user-detail", role: view.role, uid });
  }

  function goBackToUsers() {
    if (view.step === "user-detail") {
      setView({ step: "users", role: view.role });
    }
  }

  function goBackToRole() {
    if (view.step === "users" || view.step === "user-detail") {
      setView({ step: "role", role: view.role });
    }
  }

  async function handleRemoveRole(uid: string) {
    if (view.step !== "users" && view.step !== "user-detail") return;
    const role = view.role;
    const member = allMembers.find((m) => m.userId === uid);
    if (member && member.roles.length <= 1) {
      alert("Usuário não pode ficar sem perfil.");
      return;
    }
    setRemovingUid(uid);
    try {
      const currentRoles = member?.roles ?? [];
      const newRoles = currentRoles.filter((r) => r !== role);
      await api.patch(
        `/projects/${PROJECT_ID}/members/${uid}`,
        { roles: newRoles },
      );
      await fetchMembers();
      await fetchRoleUsers(role);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setRemovingUid(null);
    }
  }

  function handleAssigned() {
    if (view.step !== "empty" && "role" in view) {
      fetchRoleUsers(view.role);
    }
    fetchMembers();
  }

  // Current role definition
  const currentRole =
    view.step !== "empty" ? findRole(view.role) : undefined;

  // Selected user for detail
  const selectedUser =
    view.step === "user-detail"
      ? roleUsers.find((u) => u.uid === view.uid)
      : undefined;

  // Column visibility
  const showCol2 = view.step === "role" || view.step === "users";
  const showCol3 = view.step === "users" || view.step === "user-detail";
  const showCol4 = view.step === "user-detail";
  const col2Hidden = view.step === "user-detail";

  return (
    <>
      <div className="page-header">
        <h2>IAM — Gestão de Acesso</h2>
        <p>
          Gerencie perfis, permissões e vínculos de acesso dos usuários do
          projeto
        </p>
      </div>

      <div className="iam-columns">
        {/* Column 1 — Role list */}
        <div className="iam-col iam-col-1">
          <RoleList
            selected={view.step !== "empty" ? view.role : null}
            onSelect={selectRole}
            userCounts={userCounts}
          />
        </div>

        {/* Column 2 — Role detail */}
        <div
          className={`iam-col iam-col-2 ${col2Hidden ? "iam-col--hidden" : ""} ${!showCol2 && !col2Hidden ? "iam-col--gone" : ""}`}
        >
          {currentRole && (
            <RoleDetail
              role={currentRole}
              userCount={userCounts[currentRole.code] ?? 0}
              onShowUsers={showUsers}
            />
          )}
        </div>

        {/* Column 3 — Users list */}
        <div
          className={`iam-col iam-col-3 ${showCol3 ? "" : "iam-col--gone"}`}
        >
          {showCol3 && currentRole && (
            <>
              {showCol4 && (
                <button
                  className="iam-back-btn"
                  onClick={goBackToUsers}
                >
                  ← Voltar
                </button>
              )}
              {!showCol4 && (
                <button
                  className="iam-back-btn"
                  onClick={goBackToRole}
                >
                  ← Voltar
                </button>
              )}
              {usersLoading ? (
                <div className="iam-users-empty">Carregando...</div>
              ) : (
                <RoleUsers
                  roleLabel={currentRole.label}
                  users={roleUsers.map((u) => ({
                    uid: u.uid,
                    name: u.name,
                    email: u.email,
                    photoUrl: u.photoUrl ?? u.photo_url,
                  }))}
                  onSelectUser={selectUser}
                  onAssign={() => setAssignOpen(true)}
                  onRemove={handleRemoveRole}
                  removingUid={removingUid}
                />
              )}
            </>
          )}
        </div>

        {/* Column 4 — User detail */}
        <div
          className={`iam-col iam-col-4 ${showCol4 ? "" : "iam-col--gone"}`}
        >
          {showCol4 && selectedUser && (
            <UserDetailPanel
              user={{
                uid: selectedUser.uid,
                name: selectedUser.name,
                email: selectedUser.email,
                photoUrl: selectedUser.photoUrl ?? selectedUser.photo_url,
                birthDate:
                  selectedUser.birthDate ?? selectedUser.birth_date,
                phone: selectedUser.phone,
                roles: selectedUser.roles,
              }}
            />
          )}
        </div>

        {/* Empty state */}
        {view.step === "empty" && (
          <div className="iam-empty">
            <div className="iam-empty-icon">🔐</div>
            <p>Selecione um perfil</p>
            <span className="iam-empty-hint">
              Escolha um perfil à esquerda para ver os detalhes e gerenciar
              usuários
            </span>
          </div>
        )}
      </div>

      {/* Assign modal */}
      {currentRole && (
        <AssignUserModal
          open={assignOpen}
          roleCode={currentRole.code}
          roleLabel={currentRole.label}
          projectId={PROJECT_ID}
          onClose={() => setAssignOpen(false)}
          onAssigned={handleAssigned}
        />
      )}
    </>
  );
}
