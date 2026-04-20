import { useEffect, useRef } from "react";

interface FiltersDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  children: React.ReactNode;
}

/**
 * Right-side drawer used by RFC-12 attendance and history tabs.
 * Closes on backdrop click or Escape key.
 */
export function FiltersDrawer({
  open,
  title,
  onClose,
  onApply,
  onReset,
  children,
}: FiltersDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="filters-drawer-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="filters-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="filters-drawer-header">
          <h3 className="filters-drawer-title">{title}</h3>
          <button
            type="button"
            className="filters-drawer-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="filters-drawer-body">{children}</div>
        <div className="filters-drawer-footer">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onReset}
          >
            Limpar
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onApply}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reusable filter chip groups ─────────────────────────────────────────────

interface ChipGroupProps<T extends string | number> {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  multi?: boolean;
}

/**
 * Group of selectable chips. With `multi`, Ctrl+click toggles individual
 * items; plain click selects only that item.
 */
export function ChipGroup<T extends string | number>({
  options,
  selected,
  onChange,
  multi = false,
}: ChipGroupProps<T>) {
  function handleClick(value: T, e: React.MouseEvent) {
    if (!multi) {
      onChange([value]);
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      const set = new Set(selected);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      onChange([...set]);
    } else {
      // Plain click in multi mode toggles single (acts like single-select)
      if (selected.length === 1 && selected[0] === value) {
        onChange([]);
      } else {
        onChange([value]);
      }
    }
  }

  return (
    <div className="filters-drawer-chips">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={String(opt.value)}
            type="button"
            className={`filter-chip ${active ? "active" : ""}`}
            onClick={(e) => handleClick(opt.value, e)}
            title={multi ? "Ctrl+clique para multi-seleção" : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
