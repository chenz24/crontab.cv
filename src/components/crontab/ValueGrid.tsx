import { useT } from "@/lib/i18n";
import type { FieldMeta } from "./constants";
import { isValueSelected } from "./utils";

// ---------- Value grid ----------
export function ValueGrid({
  field,
  cronPart,
  colorVar,
  onToggle,
}: {
  field: FieldMeta;
  cronPart: string;
  colorVar: string;
  onToggle: (val: number) => void;
}) {
  const t = useT();
  const values = Array.from({ length: field.max - field.min + 1 }, (_, i) => i + field.min);

  // Day of week → pills (Vixie 0-6 with Sun=0; Quartz 1-7 with Sun=1)
  if (field.key === "dow") {
    const labels = [
      t.dow_sun(),
      t.dow_mon(),
      t.dow_tue(),
      t.dow_wed(),
      t.dow_thu(),
      t.dow_fri(),
      t.dow_sat(),
    ];
    return (
      <div className="grid grid-cols-7 gap-2">
        {values.map((val) => {
          const labelIdx = field.min === 1 ? val - 1 : val;
          const active = isValueSelected(val, cronPart);
          return (
            <button
              key={val}
              type="button"
              onClick={() => onToggle(val)}
              className="flex h-10 items-center justify-center rounded-md border font-mono text-sm font-medium transition-colors"
              style={
                active
                  ? {
                      borderColor: colorVar,
                      color: colorVar,
                      background: `color-mix(in oklab, ${colorVar} 8%, transparent)`,
                    }
                  : undefined
              }
            >
              <span className={active ? "" : "text-muted-foreground"}>{labels[labelIdx]}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Month → 12 tiles
  if (field.key === "month") {
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    return (
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {values.map((val) => {
          const active = isValueSelected(val, cronPart);
          return (
            <button
              key={val}
              type="button"
              onClick={() => onToggle(val)}
              className="flex flex-col items-center justify-center gap-0.5 rounded-md border py-2 font-mono transition-colors"
              style={
                active
                  ? {
                      borderColor: colorVar,
                      color: colorVar,
                      background: `color-mix(in oklab, ${colorVar} 8%, transparent)`,
                    }
                  : undefined
              }
            >
              <span className={`text-sm font-semibold ${active ? "" : "text-foreground"}`}>
                {val}
              </span>
              <span className={`text-[10px] ${active ? "opacity-80" : "text-muted-foreground"}`}>
                {months[val - 1]}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Numeric grid
  return (
    <div
      className={`grid gap-1.5 ${
        field.key === "dom"
          ? "grid-cols-7 sm:grid-cols-10"
          : "grid-cols-6 sm:grid-cols-10 md:grid-cols-12"
      }`}
    >
      {values.map((val) => {
        const active = isValueSelected(val, cronPart);
        return (
          <button
            key={val}
            type="button"
            onClick={() => onToggle(val)}
            className="aspect-square rounded-md border font-mono text-sm transition-colors hover:border-foreground/30"
            style={
              active
                ? {
                    borderColor: colorVar,
                    color: colorVar,
                    background: `color-mix(in oklab, ${colorVar} 8%, transparent)`,
                  }
                : undefined
            }
          >
            <span className={active ? "" : "text-muted-foreground"}>{val}</span>
          </button>
        );
      })}
    </div>
  );
}
