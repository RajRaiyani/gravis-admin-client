import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedLabels = useMemo(() => {
    const selectedSet = new Set(value);
    return options
      .filter((option) => selectedSet.has(option.value))
      .map((option) => option.label);
  }, [options, value]);

  const toggleValue = (optionValue: string) => {
    const selectedSet = new Set(value);
    if (selectedSet.has(optionValue)) {
      selectedSet.delete(optionValue);
    } else {
      selectedSet.add(optionValue);
    }
    onChange(Array.from(selectedSet));
  };

  const clearAll = () => onChange([]);

  return (
    <div className={`relative ${className || ""}`}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={() => setOpen((previous) => !previous)}
      >
        <span className="truncate text-left">
          {selectedLabels.length ? `${selectedLabels.length} selected` : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </Button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-md border border-border bg-background p-2 shadow-md">
          <div className="max-h-56 space-y-1 overflow-auto pr-1">
            {options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                  onClick={() => toggleValue(option.value)}
                >
                  <span>{option.label}</span>
                  {isSelected ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {selectedLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedLabels.slice(0, 3).map((label) => (
            <Badge key={label} variant="secondary" className="text-xs">
              {label}
            </Badge>
          ))}
          {selectedLabels.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedLabels.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
