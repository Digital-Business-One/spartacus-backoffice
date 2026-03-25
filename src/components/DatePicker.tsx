import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-day-picker/style.css";

interface DatePickerProps {
  label?: string;
  value: string;           // DD/MM/YYYY
  onChange: (v: string) => void;
  required?: boolean;
  autoFocus?: boolean;
}

export function DatePicker({ label, value, onChange, required, autoFocus }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setInputValue(value); }, [value]);
  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Parse displayed value to Date
  const parsed = parse(value, "dd/MM/yyyy", new Date());
  const selected = isValid(parsed) ? parsed : undefined;

  function handleInputChange(raw: string) {
    // Auto-format as user types: DD/MM/YYYY
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    setInputValue(formatted);

    if (digits.length === 8) {
      const d = parse(formatted, "dd/MM/yyyy", new Date());
      if (isValid(d)) {
        onChange(formatted);
      }
    }
  }

  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    const formatted = format(day, "dd/MM/yyyy");
    setInputValue(formatted);
    onChange(formatted);
    setOpen(false);
  }

  return (
    <div className="form-group" ref={containerRef} style={{ position: "relative" }}>
      {label && <label>{label}</label>}
      <div className="datepicker-input-wrap">
        <input
          ref={inputRef}
          className="form-input"
          placeholder="DD/MM/AAAA"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          maxLength={10}
          required={required}
          autoComplete="off"
        />
        <button
          type="button"
          className="datepicker-toggle"
          onClick={() => setOpen(!open)}
          tabIndex={-1}
          aria-label="Abrir calendário"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="datepicker-dropdown">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleDaySelect}
            locale={ptBR}
            defaultMonth={selected ?? new Date(2010, 0)}
            captionLayout="dropdown"
            startMonth={new Date(1940, 0)}
            endMonth={new Date()}
            classNames={{
              root: "rdp-spartacus",
            }}
          />
        </div>
      )}
    </div>
  );
}
