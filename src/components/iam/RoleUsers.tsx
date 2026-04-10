import { useState } from "react";
import { AccountAvatar } from "../account/AccountAvatar";

export interface RoleUser {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  photo_url?: string | null;
}

interface RoleUsersProps {
  roleLabel: string;
  users: RoleUser[];
  onSelectUser: (uid: string) => void;
  onAssign: () => void;
  onRemove: (uid: string) => void;
  removingUid: string | null;
}

export function RoleUsers({
  roleLabel,
  users,
  onSelectUser,
  onAssign,
  onRemove,
  removingUid,
}: RoleUsersProps) {
  return (
    <div className="iam-users-panel">
      <div className="iam-users-header">
        <h3 className="iam-users-title">Usuários</h3>
        <button className="btn btn-primary btn-sm" onClick={onAssign}>
          + Atribuir
        </button>
      </div>
      <div className="iam-users-list">
        {users.length === 0 ? (
          <div className="iam-users-empty">
            Nenhum usuário com este perfil.
          </div>
        ) : (
          users.map((u) => (
            <UserCard
              key={u.uid}
              user={u}
              roleLabel={roleLabel}
              onSelect={() => onSelectUser(u.uid)}
              onRemove={() => onRemove(u.uid)}
              isRemoving={removingUid === u.uid}
            />
          ))
        )}
      </div>
    </div>
  );
}

function UserCard({
  user,
  roleLabel,
  onSelect,
  onRemove,
  isRemoving,
}: {
  user: RoleUser;
  roleLabel: string;
  onSelect: () => void;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const photoUrl = user.photoUrl ?? user.photo_url ?? null;

  if (confirmOpen) {
    return (
      <div className="iam-user-card iam-user-card--confirm">
        <div className="iam-user-confirm-text">
          Remover <strong>{user.name}</strong> do perfil{" "}
          <strong>{roleLabel}</strong>?
        </div>
        <div className="iam-user-confirm-actions">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setConfirmOpen(false)}
          >
            Cancelar
          </button>
          <button
            className="btn btn-sm iam-btn-danger"
            onClick={onRemove}
            disabled={isRemoving}
          >
            {isRemoving ? "..." : "Remover"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="iam-user-card" onClick={onSelect}>
      <AccountAvatar name={user.name} photoUrl={photoUrl} size="sm" />
      <div className="iam-user-info">
        <div className="iam-user-name">{user.name}</div>
        <div className="iam-user-email">{user.email}</div>
      </div>
      <button
        className="iam-user-remove-btn"
        onClick={(e) => {
          e.stopPropagation();
          setConfirmOpen(true);
        }}
        title="Remover do perfil"
      >
        ✕
      </button>
    </div>
  );
}
