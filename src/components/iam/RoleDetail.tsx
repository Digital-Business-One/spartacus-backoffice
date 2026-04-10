import type { RoleDefinition } from "./roles";

interface RoleDetailProps {
  role: RoleDefinition;
  userCount: number;
  onShowUsers: () => void;
}

export function RoleDetail({ role, userCount, onShowUsers }: RoleDetailProps) {
  return (
    <div className="iam-role-detail">
      <div className="iam-role-detail-header">
        <span className="iam-role-detail-icon">{role.icon}</span>
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
        <span className="iam-users-card-icon">👥</span>
        <span className="iam-users-card-label">Usuários</span>
        <span className="iam-users-card-count">{userCount}</span>
        <span className="iam-users-card-arrow">›</span>
      </button>
    </div>
  );
}
