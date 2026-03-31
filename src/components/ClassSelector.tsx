/**
 * ClassSelector — reusable class selection panel matching the mobile app design.
 * Cards with subtle highlight, round check circles, modality + schedule info.
 */

interface ClassOption {
  id: string;
  name: string;
  modality_name: string;
  schedule: string;
  teacher?: string;
  location?: string;
}

interface ClassSelectorProps {
  classes: ClassOption[];
  loading: boolean;
  selected: string[];
  onToggle: (id: string) => void;
}

export function ClassSelector({ classes, loading, selected, onToggle }: ClassSelectorProps) {
  if (loading) {
    return (
      <div className="class-empty">
        <span className="loading-spinner" style={{ width: 20, height: 20 }} />
        <span>Carregando turmas...</span>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="class-empty">
        <div style={{ fontSize: "2rem" }}>🔎</div>
        <span>Nenhuma turma disponível no momento.</span>
        <span className="class-empty-sub">
          A equipe irá orientá-lo sobre as turmas disponíveis após a aprovação da conta.
        </span>
      </div>
    );
  }

  return (
    <div className="class-list">
      {classes.map((cls) => {
        const active = selected.includes(cls.id);
        return (
          <div
            key={cls.id}
            className={`class-card ${active ? "selected" : ""}`}
            onClick={() => onToggle(cls.id)}
          >
            <div className="class-card-body">
              <div className={`class-card-name ${active ? "selected" : ""}`}>{cls.name}</div>
              <div className="class-card-info">{cls.modality_name} · {cls.schedule}</div>
              {cls.teacher && <div className="class-card-teacher">Prof. {cls.teacher}</div>}
            </div>
            <div className={`class-check ${active ? "selected" : ""}`}>
              {active && "✓"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
