interface PlaceholderTabProps {
  icon: string;
  title: string;
  message?: string;
}

/**
 * Generic empty-state placeholder for tabs that are scheduled for
 * implementation in later phases of RFC-12.
 */
export function PlaceholderTab({ icon, title, message }: PlaceholderTabProps) {
  return (
    <div className="detail-empty-tab">
      <div style={{ fontSize: "2rem" }}>{icon}</div>
      <h3 style={{ margin: "0.5rem 0", color: "var(--text-primary)" }}>
        {title}
      </h3>
      {message && <p>{message}</p>}
    </div>
  );
}
