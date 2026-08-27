import { cn } from "../lib/cn";

export interface VariantOption {
  id: string;
  value: string;
  available?: boolean;
}

export function VariantPicker({
  label,
  options,
  selectedId,
  onSelect,
}: {
  label: string;
  options: VariantOption[];
  selectedId: string | null;
  onSelect: (optionId: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const isSelected = option.id === selectedId;
          const isAvailable = option.available ?? true;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={!isAvailable}
              onClick={() => onSelect(option.id)}
              className={cn(
                "rounded-[var(--sf-radius,0.5rem)] border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                isSelected
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border text-foreground hover:bg-muted"
              )}
            >
              {option.value}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
