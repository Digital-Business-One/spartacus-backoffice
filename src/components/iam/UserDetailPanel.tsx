import { useNavigate } from "react-router-dom";
import { AccountAvatar } from "../account/AccountAvatar";
import { ROLE_LABELS, calcAge } from "../account/types";

interface UserDetailPanelProps {
  user: {
    uid: string;
    name: string;
    email: string;
    photoUrl?: string | null;
    photo_url?: string | null;
    birthDate?: string | null;
    birth_date?: string | null;
    phone?: string | null;
    roles: string[];
  };
}

export function UserDetailPanel({ user }: UserDetailPanelProps) {
  const navigate = useNavigate();
  const photoUrl = user.photoUrl ?? user.photo_url ?? null;
  const birthDate = user.birthDate ?? user.birth_date ?? null;
  const age = calcAge(birthDate);

  return (
    <div className="iam-user-detail">
      <h3 className="iam-user-detail-title">Detalhes do Usuário</h3>
      <div className="iam-user-detail-header">
        <AccountAvatar name={user.name} photoUrl={photoUrl} size="lg" />
        <div className="iam-user-detail-name">{user.name}</div>
      </div>

      <div className="iam-user-detail-rows">
        <DetailRow label="E-mail" value={user.email} />
        {birthDate && (
          <DetailRow
            label="Nascimento"
            value={`${birthDate}${age !== null ? ` (${age} anos)` : ""}`}
          />
        )}
        {user.phone && <DetailRow label="Telefone" value={user.phone} />}
      </div>

      <div className="iam-section">
        <h4 className="iam-section-title">Perfis</h4>
        <div className="iam-permissions">
          {user.roles.map((r) => (
            <span key={r} className="iam-permission-badge">
              {ROLE_LABELS[r] ?? r}
            </span>
          ))}
        </div>
      </div>

      <button
        className="btn btn-outline btn-sm iam-view-profile-btn"
        onClick={() => navigate(`/contas/${user.uid}`)}
      >
        Ver perfil completo →
      </button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="iam-detail-row">
      <span className="iam-detail-row-label">{label}</span>
      <span className="iam-detail-row-value">{value}</span>
    </div>
  );
}
