import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../../lib/api";
import { buildDetailHref } from "../../../lib/buildDetailHref";
import { STATUS_LABELS, calcAge } from "../types";

interface DependentsTabProps {
  uid: string;
}

interface Dependent {
  uid: string;
  name: string;
  birthDate?: string | null;
  gender?: string | null;
  photoUrl?: string | null;
  roles: string[];
  approvalStatus: string;
  classIds: string[];
  classNames: string[];
  registrationComplete: boolean;
}

export function DependentsTab({ uid }: DependentsTabProps) {
  const [items, setItems] = useState<Dependent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await api.get<Dependent[]>(
          `/accounts/${uid}/dependents`,
        );
        if (!cancelled) setItems(result);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  if (loading) {
    return (
      <div className="hub-loading">
        <span className="loading-spinner" style={{ width: 24, height: 24 }} />
        <span>Carregando dependentes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-empty-tab">
        <div style={{ fontSize: "2rem" }}>⚠️</div>
        <p>{error}</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="detail-empty-tab">
        <div style={{ fontSize: "2rem" }}>👨‍👩‍👧</div>
        <h3 style={{ margin: "0.5rem 0", color: "var(--text-primary)" }}>
          Nenhum dependente
        </h3>
        <p>Esta conta não possui dependentes cadastrados.</p>
      </div>
    );
  }

  // The "from" link for dependents must point back to the guardian's
  // detail page WITHOUT the tab=dependents param, so that going back lands
  // on the default tab (RFC-12 D17).
  const guardianBaseUrl = `${location.pathname}${buildSearchWithoutTab(location.search)}`;

  return (
    <div className="detail-tab-content">
      <div className="dependents-grid">
        {items.map((dep) => {
          const initials = dep.name
            .split(" ")
            .map((w) => w[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();
          const age = calcAge(dep.birthDate ?? undefined);
          const statusInfo =
            STATUS_LABELS[dep.approvalStatus] ?? {
              label: dep.approvalStatus,
              variant: "muted",
            };
          const href = buildDetailHref(dep.uid, {
            pathname: location.pathname,
            search: stripTabFromSearch(location.search),
          });
          return (
            <div
              key={dep.uid}
              className="dependent-card"
              onClick={() =>
                navigate(
                  `/contas/${dep.uid}?from=${encodeURIComponent(guardianBaseUrl)}`,
                )
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(href);
              }}
            >
              <div className="dependent-card-header">
                {dep.photoUrl ? (
                  <img
                    src={dep.photoUrl}
                    alt={dep.name}
                    className="dependent-card-avatar dependent-card-avatar--photo"
                  />
                ) : (
                  <div className="dependent-card-avatar">{initials}</div>
                )}
                <div className="dependent-card-info">
                  <div className="dependent-card-name">{dep.name}</div>
                  <div className="dependent-card-meta">
                    {age !== null && <span>{age} anos</span>}
                    {dep.gender && (
                      <>
                        {age !== null && <span> · </span>}
                        <span>
                          {dep.gender === "male" ? "Masculino" : "Feminino"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span
                  className={`status-badge status-badge--${statusInfo.variant}`}
                >
                  {statusInfo.label}
                </span>
              </div>

              {dep.classNames.length > 0 && (
                <div className="dependent-card-classes">
                  {dep.classNames.map((name) => (
                    <span key={name} className="account-role-chip">
                      {name}
                    </span>
                  ))}
                </div>
              )}

              {!dep.registrationComplete && (
                <div className="dependent-card-warning">
                  ⚠️ Cadastro incompleto
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Returns the search string with `tab` removed (RFC-12 D17). */
function stripTabFromSearch(search: string): string {
  const params = new URLSearchParams(search);
  params.delete("tab");
  const rest = params.toString();
  return rest ? `?${rest}` : "";
}

/** Same as stripTabFromSearch but returns the bare suffix. */
function buildSearchWithoutTab(search: string): string {
  return stripTabFromSearch(search);
}
