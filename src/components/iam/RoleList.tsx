import { useState } from "react";
import { ROLES, type RoleDefinition } from "./roles";
import { RoleIcon } from "./RoleIcon";

interface RoleListProps {
  selected: string | null;
  onSelect: (code: string) => void;
  userCounts: Record<string, number>;
}

export function RoleList({ selected, onSelect, userCounts }: RoleListProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? ROLES.filter((r) => r.label.toLowerCase().includes(search.toLowerCase()))
    : ROLES;

  return (
    <div className="iam-role-list">
      <h3 className="iam-role-list-title">Perfis de Acesso</h3>
      <input
        type="text"
        className="iam-role-search"
        placeholder="Buscar perfil..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="iam-role-items">
        {filtered.map((r) => (
          <RoleItem
            key={r.code}
            role={r}
            active={selected === r.code}
            count={userCounts[r.code] ?? 0}
            onClick={() => onSelect(r.code)}
          />
        ))}
      </div>
    </div>
  );
}

function RoleItem({
  role,
  active,
  count,
  onClick,
}: {
  role: RoleDefinition;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      className={`iam-role-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="iam-role-item-icon">
        <RoleIcon code={role.code} size={18} />
      </span>
      <span className="iam-role-item-label">{role.label}</span>
      {role.badge && (
        <span className={`iam-role-badge iam-role-badge--${role.badge.toLowerCase()}`}>
          {role.badge}
        </span>
      )}
      {count > 0 && <span className="iam-role-count">{count}</span>}
    </button>
  );
}
