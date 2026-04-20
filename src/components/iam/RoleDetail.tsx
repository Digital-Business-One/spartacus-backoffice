import type { RoleDefinition } from "./roles";
import { RoleIcon } from "./RoleIcon";

interface RoleDetailProps {
  role: RoleDefinition;
  userCount: number;
  onShowUsers: () => void;
}

export function RoleDetail({ role, userCount, onShowUsers }: RoleDetailProps) {
  return (
    <div className="iam-role-detail">
      <div className="iam-role-detail-header">
        <span className="iam-role-detail-icon">
          <RoleIcon code={role.code} size={24} />
        </span>
        <h2 className="iam-role-detail-name">{role.label}</h2>
        {role.badge && (
          <span className={`iam-role-badge iam-role-badge--${role.badge.toLowerCase()}`}>
            {role.badge}
          </span>
        )}
      </div>

      <div className="iam-section">
        <h4 className="iam-section-title">Sobre este perfil</h4>
        <p className="iam-section-text">{role.description}</p>
      </div>

      <div className="iam-section">
        <h4 className="iam-section-title">Permissões</h4>
        <div className="iam-permissions">
          {role.permissions.map((p) => (
            <span key={p} className="iam-permission-badge">{p}</span>
          ))}
        </div>
      </div>

      <button className="iam-users-card" onClick={onShowUsers}>
        <span className="iam-users-card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        <span className="iam-users-card-label">Usuários</span>
        <span className="iam-users-card-count">{userCount}</span>
        <span className="iam-users-card-arrow">›</span>
      </button>
    </div>
  );
}
