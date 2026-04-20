import { useState } from "react";
import { AccountAvatar } from "../account/AccountAvatar";

export interface RoleUser {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  photo_url?: string | null;
  roles?: string[];
}

export interface RowError {
  uid: string;
  message: string;
}

interface RoleUsersProps {
  roleLabel: string;
  users: RoleUser[];
  onSelectUser: (uid: string) => void;
  onAssign: () => void;
  onRemove: (uid: string) => void;
  removingUid: string | null;
  rowError: RowError | null;
  onDismissError: () => void;
}

export function RoleUsers({
  roleLabel,
  users,
  onSelectUser,
  onAssign,
  onRemove,
  removingUid,
  rowError,
  onDismissError,
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
              error={rowError?.uid === u.uid ? rowError.message : null}
              onDismissError={onDismissError}
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
  error,
  onDismissError,
}: {
  user: RoleUser;
  roleLabel: string;
  onSelect: () => void;
  onRemove: () => void;
  isRemoving: boolean;
  error: string | null;
  onDismissError: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const photoUrl = user.photoUrl ?? user.photo_url ?? null;

  if (error) {
    return (
      <div className="iam-user-card iam-user-card--error">
        <div className="iam-user-error-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="iam-user-error-body">
          <div className="iam-user-error-title">Não foi possível remover</div>
          <div className="iam-user-error-msg">{error}</div>
        </div>
        <button
          className="iam-user-error-dismiss"
          onClick={onDismissError}
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
    );
  }

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
            onClick={() => {
              onRemove();
              setConfirmOpen(false);
            }}
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
