import type { AccountDetail, ClassDetail } from "../types";

interface ClassesTabProps {
  account: AccountDetail;
}

const DAY_LABELS: Record<string, string> = {
  mon: "Seg",
  tue: "Ter",
  wed: "Qua",
  thu: "Qui",
  fri: "Sex",
  sat: "Sáb",
  sun: "Dom",
};

const DAY_INITIALS: Record<string, string> = {
  mon: "S",
  tue: "T",
  wed: "Q",
  thu: "Q",
  fri: "S",
  sat: "S",
  sun: "D",
};

const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

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

  // Aggregations
  const activeCount = classes.filter((c) => c.active).length;
  const modalityCount = new Set(classes.map((c) => c.modalityName)).size;
  const sessionsPerWeek = classes.reduce(
    (sum, c) => sum + (c.scheduleItems?.length ?? 0),
    0,
  );

  return (
    <div className="detail-tab-content">
      <div className="classes-stats">
        <StatCard value={activeCount} label="Turmas ativas" />
        <StatCard value={modalityCount} label="Modalidades" />
        <StatCard value={sessionsPerWeek} label="Aulas / semana" />
      </div>

      <div className="classes-list">
        {classes.map((c) => (
          <ClassCard key={c.id} item={c} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="classes-stat-card">
      <div className="classes-stat-value">{value}</div>
      <div className="classes-stat-label">{label}</div>
    </div>
  );
}

function ClassCard({ item }: { item: ClassDetail }) {
  const days = new Set(item.scheduleItems?.map((s) => s.day) ?? []);
  const firstSlot = item.scheduleItems?.[0];

  return (
    <div className="class-card">
      <div className="class-card-header">
        <div className="class-card-title">
          <span className="class-card-name">{item.name}</span>
          <span className="account-role-chip account-role-chip--success">
            {item.modalityName}
          </span>
        </div>
        <span
          className={`status-badge status-badge--${item.active ? "success" : "muted"}`}
        >
          {item.active ? "Ativa" : "Inativa"}
        </span>
      </div>

      <div className="class-card-details">
        <div className="class-card-detail">
          <span className="class-card-detail-label">Dias da semana</span>
          <div className="class-week-strip">
            {WEEK_DAYS.map((d) => (
              <span
                key={d}
                className={`class-week-day ${days.has(d) ? "active" : ""}`}
                title={DAY_LABELS[d]}
              >
                {DAY_INITIALS[d]}
              </span>
            ))}
          </div>
        </div>

        {firstSlot && (
          <div className="class-card-detail">
            <span className="class-card-detail-label">Horário</span>
            <span className="class-card-detail-value">
              {firstSlot.startTime} – {firstSlot.endTime}
            </span>
          </div>
        )}

        {item.location && (
          <div className="class-card-detail">
            <span className="class-card-detail-label">Local</span>
            <span className="class-card-detail-value">{item.location}</span>
          </div>
        )}

        {item.teacher && (
          <div className="class-card-detail">
            <span className="class-card-detail-label">Professor</span>
            <span className="class-card-detail-value">{item.teacher}</span>
          </div>
        )}
      </div>
    </div>
  );
}
