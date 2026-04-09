import type { AccountDetail, ClassDetail } from "../types";

interface ClassesTabProps {
  account: AccountDetail;
}

const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_INITIALS: Record<string, string> = {
  mon: "S", tue: "T", wed: "Q", thu: "Q", fri: "S", sat: "S", sun: "D",
};

export function ClassesTab({ account }: ClassesTabProps) {
  const classes = account.classes ?? [];

  if (classes.length === 0) {
    return (
      <div className="detail-empty-tab">
        <div style={{ fontSize: "2rem" }}>🥋</div>
        <p>Nenhuma turma vinculada</p>
      </div>
    );
  }

  const activeCount = classes.filter((c) => c.active).length;
  const modalityCount = new Set(classes.map((c) => c.modalityName)).size;
  const sessionsPerWeek = classes.reduce(
    (sum, c) => sum + (c.scheduleItems?.length ?? 0),
    0,
  );

  return (
    <div className="detail-tab-content">
      {/* Stats row with dividers */}
      <div className="ct-stats">
        <div className="ct-stat">
          <div className="ct-stat-value">{activeCount}</div>
          <div className="ct-stat-label">Turmas ativas</div>
        </div>
        <div className="ct-stat-divider" />
        <div className="ct-stat">
          <div className="ct-stat-value">{modalityCount}</div>
          <div className="ct-stat-label">Modalidades</div>
        </div>
        <div className="ct-stat-divider" />
        <div className="ct-stat">
          <div className="ct-stat-value">{sessionsPerWeek}</div>
          <div className="ct-stat-label">Aulas / semana</div>
        </div>
      </div>

      {/* Class cards */}
      <div className="ct-list">
        {classes.map((c) => (
          <ClassCard key={c.id} item={c} />
        ))}
      </div>
    </div>
  );
}

function ClassCard({ item }: { item: ClassDetail }) {
  const days = new Set(item.scheduleItems?.map((s) => s.day) ?? []);
  const firstSlot = item.scheduleItems?.[0];

  return (
    <div className="ct-card">
      {/* Header: icon + name + badges */}
      <div className="ct-card-header">
        <div className="ct-card-icon">
          <span className="ct-card-icon-inner">🥋</span>
        </div>
        <div className="ct-card-title-area">
          <div className="ct-card-name-row">
            <span className="ct-card-name">{item.name}</span>
            <span className="ct-card-modality-badge">{item.modalityName}</span>
            <span className={`ct-card-status-badge ${item.active ? "ct-card-status-badge--active" : ""}`}>
              {item.active ? "Ativa" : "Inativa"}
            </span>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="ct-card-details">
        <div className="ct-card-detail">
          <span className="ct-card-detail-label">Dias da semana</span>
          <div className="ct-week-strip">
            {WEEK_DAYS.map((d) => (
              <span
                key={d}
                className={`ct-week-day ${days.has(d) ? "active" : ""}`}
              >
                {DAY_INITIALS[d]}
              </span>
            ))}
          </div>
        </div>

        {firstSlot && (
          <div className="ct-card-detail">
            <span className="ct-card-detail-label">Horário</span>
            <span className="ct-card-detail-value">
              {firstSlot.startTime} – {firstSlot.endTime}
            </span>
          </div>
        )}

        {item.location && (
          <div className="ct-card-detail">
            <span className="ct-card-detail-label">Local</span>
            <span className="ct-card-detail-value">{item.location}</span>
          </div>
        )}

        {item.teacher && (
          <div className="ct-card-detail">
            <span className="ct-card-detail-label">Professor</span>
            <span className="ct-card-detail-value">{item.teacher}</span>
          </div>
        )}
      </div>
    </div>
  );
}
