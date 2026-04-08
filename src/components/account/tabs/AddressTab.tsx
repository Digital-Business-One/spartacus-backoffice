import { AccountDetail } from "../types";

interface AddressTabProps {
  account: AccountDetail;
}

export function AddressTab({ account }: AddressTabProps) {
  const addr = account.address;

  if (!addr || !addr.postalCode) {
    return (
      <div className="detail-empty-tab">
        <div style={{ fontSize: "2rem" }}>📍</div>
        <p>Endereço não cadastrado</p>
      </div>
    );
  }

  const fullAddress = formatFullAddress(addr);
  const mapsHref = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null;

  return (
    <div className="detail-tab-content">
      <div className="detail-section">
        <h3 className="detail-section-title">Endereço</h3>
        <Row label="CEP" value={formatCep(addr.postalCode)} />
        <Row label="Logradouro" value={addr.street} />
        <Row label="Número" value={addr.number} />
        <Row label="Complemento" value={addr.complement} />
        <Row label="Bairro" value={addr.neighborhood} />
        <Row label="Cidade" value={addr.city} />
        <Row label="Estado" value={addr.state} />
      </div>

      {mapsHref && (
        <div className="detail-map-card">
          <div className="detail-map-icon" aria-hidden>
            📍
          </div>
          <div className="detail-map-address">{fullAddress}</div>
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="detail-map-link"
          >
            Abrir no Google Maps ↗
          </a>
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function Row({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span
        className={`detail-row-value ${value ? "" : "detail-row-value--muted"}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function formatCep(cep?: string | null): string | null {
  if (!cep) return null;
  const digits = cep.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return cep;
}

function formatFullAddress(addr: NonNullable<AccountDetail["address"]>): string | null {
  const parts: string[] = [];
  if (addr.street) {
    parts.push(addr.number ? `${addr.street}, ${addr.number}` : addr.street);
  }
  if (addr.complement) parts.push(addr.complement);
  if (addr.neighborhood) parts.push(addr.neighborhood);
  if (addr.city && addr.state) {
    parts.push(`${addr.city}/${addr.state}`);
  } else if (addr.city) {
    parts.push(addr.city);
  }
  return parts.length > 0 ? parts.join(" — ") : null;
}
