import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

interface DonationsTabProps {
  uid: string;
}

interface DonationHistoryItem {
  id: string;
  month: string;          // "2026-03"
  monthLabel: string;     // "MARÇO / 2026"
  item?: string | null;
  itemLabel: string;
  itemDescription?: string | null;
  status: string;         // pledged | received | pending
  statusLabel: string;
  createdAt: string;
  receivedBy?: string | null;
  receivedByName?: string | null;
  receivedAt?: string | null;
}

interface DonationHistoryResponse {
  donations: DonationHistoryItem[];
}

const STATUS_VARIANT: Record<string, string> = {
  received: "success",
  pledged: "warning",
  pending: "muted",
};

export function DonationsTab({ uid }: DonationsTabProps) {
  const [items, setItems] = useState<DonationHistoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await api.get<DonationHistoryResponse>(
          `/accounts/${uid}/donations/history`,
        );
        if (!cancelled) setItems(result.donations);
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
        <span>Carregando doações...</span>
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
        <div style={{ fontSize: "2rem" }}>💝</div>
        <h3 style={{ margin: "0.5rem 0", color: "var(--text-primary)" }}>
          Nenhuma doação registrada
        </h3>
        <p>O histórico de doações desta conta ainda está vazio.</p>
      </div>
    );
  }

  // Aggregate stats — current year, last donation, pending count
  const currentYear = new Date().getFullYear();
  const totalThisYear = items.filter(
    (d) => d.status === "received" && d.month.startsWith(`${currentYear}-`),
  ).length;
  const pendingCount = items.filter((d) => d.status === "pledged").length;
  const lastDonation = items.find((d) => d.status === "received");

  // Only show actually recorded donations in the table (skip pending placeholders)
  const recorded = items.filter((d) => d.status !== "pending");

  return (
    <div className="detail-tab-content">
      <div className="donations-stats">
        <StatCard value={totalThisYear} label="Total no ano" />
        <StatCard
          value={lastDonation?.itemLabel ?? "—"}
          label="Última doação"
          subLabel={lastDonation?.monthLabel}
        />
        <StatCard value={pendingCount} label="Pendentes de validação" />
      </div>

      {recorded.length === 0 ? (
        <div className="detail-empty-tab">
          <div style={{ fontSize: "1.5rem" }}>📭</div>
          <p>Nenhuma doação registrada ainda neste período.</p>
        </div>
      ) : (
        <div className="donations-table-wrapper">
          <table className="donations-table">
            <thead>
              <tr>
                <th>Mês de referência</th>
                <th>Item doado</th>
                <th>Data do registro</th>
                <th>Status</th>
                <th>Validado por</th>
              </tr>
            </thead>
            <tbody>
              {recorded.map((d) => {
                const variant = STATUS_VARIANT[d.status] ?? "muted";
                return (
                  <tr key={d.id}>
                    <td className="donations-month">{d.monthLabel}</td>
                    <td>
                      {d.itemLabel}
                      {d.itemDescription && (
                        <div className="donations-description">
                          {d.itemDescription}
                        </div>
                      )}
                    </td>
                    <td className="donations-muted">{d.createdAt}</td>
                    <td>
                      <span className={`status-badge status-badge--${variant}`}>
                        {d.statusLabel}
                      </span>
                    </td>
                    <td className="donations-muted">
                      {d.receivedByName ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  value,
  label,
  subLabel,
}: {
  value: string | number;
  label: string;
  subLabel?: string;
}) {
  return (
    <div className="classes-stat-card">
      <div className="classes-stat-value classes-stat-value--text">{value}</div>
      <div className="classes-stat-label">{label}</div>
      {subLabel && <div className="classes-stat-sublabel">{subLabel}</div>}
    </div>
  );
}
