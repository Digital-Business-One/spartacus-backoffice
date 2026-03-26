interface HubSectionProps {
  icon: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
  disabled?: boolean;
}

export function HubSection({ icon, title, subtitle, action, children, disabled }: HubSectionProps) {
  return (
    <section className={`hub-section ${disabled ? "hub-section--disabled" : ""}`}>
      <div className="hub-section-header">
        <div className="hub-section-icon">{icon}</div>
        <div className="hub-section-titles">
          <h3 className="hub-section-title">{title}</h3>
          {subtitle && <p className="hub-section-subtitle">{subtitle}</p>}
        </div>
        {action && !disabled && (
          <button className="btn btn-primary btn-sm" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
      <div className="hub-section-body">
        {children}
      </div>
    </section>
  );
}
