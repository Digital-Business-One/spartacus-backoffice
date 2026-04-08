import {
  AUTH_PROVIDER_LABELS,
  AccountDetail,
  GENDER_LABELS,
  RELATIONSHIP_LABELS,
  calcAge,
  formatDate,
  formatDateTime,
} from "../types";

interface PersonalDataTabProps {
  account: AccountDetail;
}

export function PersonalDataTab({ account }: PersonalDataTabProps) {
  const age = calcAge(account.birthDate);
  const ageCategoryLabel =
    account.ageCategory === "child"
      ? "Infantil"
      : account.ageCategory === "adult"
        ? "Adulto"
        : null;
  const authProviderLabel = account.authProvider
    ? AUTH_PROVIDER_LABELS[account.authProvider] ?? account.authProvider
    : null;
  const genderLabel = account.gender ? GENDER_LABELS[account.gender] : null;

  return (
    <div className="detail-tab-content">
      {account.isDependent && account.guardianUid && (
        <GuardianCard
          guardianUid={account.guardianUid}
          guardianName={account.guardianName}
          guardianPhone={account.guardianPhone}
          relationship={account.guardianRelationship}
        />
      )}

      <Section title="Identificação">
        <Row label="Nome completo" value={account.name} />
        <Row
          label="E-mail"
          value={account.email ?? "—"}
          badge={
            account.emailVerified ? (
              <span className="detail-verified-badge">✓ Verificado</span>
            ) : null
          }
        />
        <Row label="CPF" value={formatTaxId(account.taxId)} />
        <Row label="Nascimento" value={renderBirthDate(account.birthDate, age)} />
        <Row label="Sexo" value={genderLabel} />
        <Row label="Faixa etária" value={ageCategoryLabel} />
      </Section>

      <Section title="Contato">
        <Row label="Telefone" value={formatPhone(account.phone)} />
        <Row label="WhatsApp" value={formatPhone(account.whatsapp)} />
      </Section>

      <Section title="Cadastro">
        <Row label="Data de criação" value={formatDateTime(account.createdAt)} />
        <Row label="Última atualização" value={formatDateTime(account.updatedAt)} />
        <Row label="Forma de cadastro" value={authProviderLabel} />
        {account.approvedByName ? (
          <Row
            label="Aprovado por"
            value={`${account.approvedByName} em ${formatDate(account.approvedAt)}`}
          />
        ) : (
          <Row label="Aprovado por" value={null} />
        )}
        <Row label="ID interno" value={account.uid} mono />
      </Section>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function GuardianCard({
  guardianUid,
  guardianName,
  guardianPhone,
  relationship,
}: {
  guardianUid: string;
  guardianName?: string | null;
  guardianPhone?: string | null;
  relationship?: string | null;
}) {
  const relationshipLabel = relationship
    ? RELATIONSHIP_LABELS[relationship] ?? relationship
    : null;
  const initials = (guardianName || guardianUid)
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="detail-guardian-card">
      <div className="detail-guardian-label">
        Este aluno é dependente de
      </div>
      <div className="detail-guardian-row">
        <div className="detail-guardian-avatar">{initials}</div>
        <div className="detail-guardian-info">
          <div className="detail-guardian-name">
            {guardianName ?? guardianUid}
          </div>
          <div className="detail-guardian-meta">
            {relationshipLabel && (
              <>
                <span>Tipo: {relationshipLabel}</span>
                {guardianPhone && <span> · </span>}
              </>
            )}
            {guardianPhone && <span>{formatPhone(guardianPhone)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="detail-section">
      <h3 className="detail-section-title">{title}</h3>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  badge,
  mono,
}: {
  label: string;
  value?: string | null;
  badge?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span
        className={`detail-row-value ${value ? "" : "detail-row-value--muted"}`}
        style={mono ? { fontFamily: "monospace", fontSize: "0.78rem" } : undefined}
      >
        {badge}
        {value || "—"}
      </span>
    </div>
  );
}

// ── Formatters ──────────────────────────────────────────────────────────────

function formatPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

function formatTaxId(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return raw;
}

function renderBirthDate(birthDate?: string | null, age?: number | null): string | null {
  if (!birthDate) return null;
  if (age !== null && age !== undefined) return `${birthDate} (${age} anos)`;
  return birthDate;
}
