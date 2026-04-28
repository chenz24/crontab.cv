import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/lib/i18n";
import type { CronMode, FieldMeta } from "./constants";
import { ValueGrid } from "./ValueGrid";

type Mode =
  | "every"
  | "any" // "?" — Quartz only, for dom/dow
  | "step"
  | "range"
  | "specific"
  | "lastDay" // "L" (dom) / "{dow}L" (dow)
  | "lastWeekday" // "LW" (dom only)
  | "daysBeforeEnd" // "L-N" (dom only)
  | "nearestWeekday" // "nW" (dom only)
  | "nthDow"; // "{dow}#{N}" (dow only)

interface StepInfo {
  start: number;
  step: number;
}

interface RangeInfo {
  from: number;
  to: number;
}

function detectMode(expr: string, field: FieldMeta): Mode {
  if (expr === "*") return "every";
  if (expr === "?") return "any";
  if (field.key === "dom") {
    if (expr === "L") return "lastDay";
    if (expr === "LW") return "lastWeekday";
    if (/^L-\d+$/.test(expr)) return "daysBeforeEnd";
    if (/^\d+W$/.test(expr)) return "nearestWeekday";
  }
  if (field.key === "dow") {
    if (/^\d+L$/.test(expr)) return "lastDay";
    if (/^\d+#\d+$/.test(expr)) return "nthDow";
  }
  if (expr.includes("/")) return "step";
  if (/^\d+-\d+$/.test(expr)) return "range";
  return "specific";
}

function parseStep(expr: string, min: number): StepInfo {
  const m = /^(\*|\d+)\/(\d+)$/.exec(expr);
  if (m) {
    return {
      start: m[1] === "*" ? min : parseInt(m[1], 10),
      step: parseInt(m[2], 10) || 1,
    };
  }
  return { start: min, step: 1 };
}

function parseRange(expr: string, min: number, max: number): RangeInfo {
  const m = /^(\d+)-(\d+)$/.exec(expr);
  if (m) return { from: parseInt(m[1], 10), to: parseInt(m[2], 10) };
  return { from: min, to: max };
}

export function FieldModeEditor({
  field,
  cronMode,
  cronPart,
  colorVar,
  onPartChange,
  onToggle,
}: {
  field: FieldMeta;
  cronMode: CronMode;
  cronPart: string;
  colorVar: string;
  onPartChange: (value: string) => void;
  onToggle: (val: number) => void;
}) {
  const t = useT();
  const { min, max } = field;
  const isQuartz = cronMode === "quartz";
  const isDom = field.key === "dom";
  const isDow = field.key === "dow";

  const mode = detectMode(cronPart, field);
  const stepInfo = parseStep(cronPart, min);
  const rangeInfo = parseRange(cronPart, min, max);

  const values = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  // Parse advanced values (used by Quartz-only modes)
  const daysBeforeEndN = (() => {
    const m = /^L-(\d+)$/.exec(cronPart);
    return m ? parseInt(m[1], 10) : 1;
  })();
  const nearestWeekdayN = (() => {
    const m = /^(\d+)W$/.exec(cronPart);
    return m ? parseInt(m[1], 10) : 1;
  })();
  const lastDowN = (() => {
    const m = /^(\d+)L$/.exec(cronPart);
    return m ? parseInt(m[1], 10) : min;
  })();
  const nthDowInfo = (() => {
    const m = /^(\d+)#(\d+)$/.exec(cronPart);
    if (m) return { dow: parseInt(m[1], 10), nth: parseInt(m[2], 10) };
    return { dow: min, nth: 1 };
  })();

  const DOW_LABELS = [
    t.dow_sun(),
    t.dow_mon(),
    t.dow_tue(),
    t.dow_wed(),
    t.dow_thu(),
    t.dow_fri(),
    t.dow_sat(),
  ];
  const dowLabel = (v: number) => {
    const idx = field.min === 1 ? v - 1 : v;
    return DOW_LABELS[idx] ?? String(v);
  };

  const setMode = (m: Mode) => {
    if (m === mode) return;
    switch (m) {
      case "every":
        onPartChange("*");
        break;
      case "any":
        onPartChange("?");
        break;
      case "step":
        onPartChange(`${min}/1`);
        break;
      case "range":
        onPartChange(`${min}-${max}`);
        break;
      case "specific":
        onPartChange(String(min));
        break;
      case "lastDay":
        onPartChange(isDom ? "L" : `${min}L`);
        break;
      case "lastWeekday":
        onPartChange("LW");
        break;
      case "daysBeforeEnd":
        onPartChange("L-1");
        break;
      case "nearestWeekday":
        onPartChange("1W");
        break;
      case "nthDow":
        onPartChange(`${min}#1`);
        break;
    }
  };

  const unitLabel =
    field.key === "second"
      ? t.field_second()
      : field.key === "minute"
        ? t.field_minute()
        : field.key === "hour"
          ? t.field_hour()
          : field.key === "dom"
            ? t.field_dom()
            : field.key === "month"
              ? t.field_month()
              : t.field_dow();

  const fk = field.key;

  return (
    <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)} className="space-y-3">
      {/* Every */}
      <div className="flex items-center gap-2">
        <RadioGroupItem value="every" id={`mode-every-${fk}`} />
        <Label htmlFor={`mode-every-${fk}`} className="text-sm cursor-pointer">
          {t.mode_every({ unit: unitLabel })}
        </Label>
      </div>

      {/* Any (? — Quartz only for dom/dow) */}
      {isQuartz && (isDom || isDow) && (
        <div className="flex items-center gap-2">
          <RadioGroupItem value="any" id={`mode-any-${fk}`} />
          <Label htmlFor={`mode-any-${fk}`} className="text-sm cursor-pointer">
            <span className="font-mono">?</span> {isDom ? t.mode_any_label_dom() : t.mode_any_label_dow()}
          </Label>
        </div>
      )}

      {/* Step */}
      <div className="flex flex-wrap items-center gap-2">
        <RadioGroupItem value="step" id={`mode-step-${fk}`} />
        <Label htmlFor={`mode-step-${fk}`} className="text-sm cursor-pointer">
          {t.mode_step_prefix()}
        </Label>
        <Select
          value={String(stepInfo.step)}
          onValueChange={(v) => {
            const s = stepInfo.start;
            onPartChange(`${s}/${v}`);
          }}
          disabled={mode !== "step"}
        >
          <SelectTrigger className="h-7 w-16 font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {values
              .filter((v) => v >= 1)
              .map((v) => (
                <SelectItem key={v} value={String(v)} className="font-mono text-xs">
                  {String(v)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {t.mode_step_mid({ unit: unitLabel })}
        </span>
        <Select
          value={String(stepInfo.start)}
          onValueChange={(v) => {
            onPartChange(`${v}/${stepInfo.step}`);
          }}
          disabled={mode !== "step"}
        >
          <SelectTrigger className="h-7 w-16 font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {values.map((v) => (
              <SelectItem key={v} value={String(v)} className="font-mono text-xs">
                {String(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {t.mode_step_suffix({ unit: unitLabel })}
        </span>
      </div>

      {/* Range */}
      <div className="flex flex-wrap items-center gap-2">
        <RadioGroupItem value="range" id={`mode-range-${fk}`} />
        <Label htmlFor={`mode-range-${fk}`} className="text-sm cursor-pointer">
          {t.mode_range_from()}
        </Label>
        <Select
          value={String(rangeInfo.from)}
          onValueChange={(v) => {
            onPartChange(`${v}-${rangeInfo.to}`);
          }}
          disabled={mode !== "range"}
        >
          <SelectTrigger className="h-7 w-16 font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {values.map((v) => (
              <SelectItem key={v} value={String(v)} className="font-mono text-xs">
                {String(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{t.mode_range_to()}</span>
        <Select
          value={String(rangeInfo.to)}
          onValueChange={(v) => {
            onPartChange(`${rangeInfo.from}-${v}`);
          }}
          disabled={mode !== "range"}
        >
          <SelectTrigger className="h-7 w-16 font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {values.map((v) => (
              <SelectItem key={v} value={String(v)} className="font-mono text-xs">
                {String(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{unitLabel}</span>
      </div>

      {/* Specific */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="specific" id={`mode-specific-${fk}`} />
          <Label htmlFor={`mode-specific-${fk}`} className="text-sm cursor-pointer">
            {t.mode_specific({ unit: unitLabel })}
          </Label>
        </div>
        {mode === "specific" && (
          <div className="ml-6">
            <ValueGrid field={field} cronPart={cronPart} colorVar={colorVar} onToggle={onToggle} />
          </div>
        )}
      </div>

      {/* ===== Quartz advanced: day-of-month ===== */}
      {isQuartz && isDom && (
        <>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="lastDay" id={`mode-lastDay-${fk}`} />
            <Label htmlFor={`mode-lastDay-${fk}`} className="text-sm cursor-pointer">
              {t.mode_lastDay_dom()}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="lastWeekday" id={`mode-lastWeekday-${fk}`} />
            <Label htmlFor={`mode-lastWeekday-${fk}`} className="text-sm cursor-pointer">
              {t.mode_lastWeekday()}
            </Label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RadioGroupItem value="daysBeforeEnd" id={`mode-daysBeforeEnd-${fk}`} />
            <Label htmlFor={`mode-daysBeforeEnd-${fk}`} className="text-sm cursor-pointer">
              {t.mode_daysBeforeEnd_prefix()}
            </Label>
            <Select
              value={String(daysBeforeEndN)}
              onValueChange={(v) => onPartChange(`L-${v}`)}
              disabled={mode !== "daysBeforeEnd"}
            >
              <SelectTrigger className="h-7 w-16 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((v) => (
                  <SelectItem key={v} value={String(v)} className="font-mono text-xs">
                    {String(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{t.mode_daysBeforeEnd_suffix()}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RadioGroupItem value="nearestWeekday" id={`mode-nearestWeekday-${fk}`} />
            <Label htmlFor={`mode-nearestWeekday-${fk}`} className="text-sm cursor-pointer">
              {t.mode_nearestWeekday_prefix()}
            </Label>
            <Select
              value={String(nearestWeekdayN)}
              onValueChange={(v) => onPartChange(`${v}W`)}
              disabled={mode !== "nearestWeekday"}
            >
              <SelectTrigger className="h-7 w-16 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {values.map((v) => (
                  <SelectItem key={v} value={String(v)} className="font-mono text-xs">
                    {String(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{t.mode_nearestWeekday_suffix()}</span>
          </div>
        </>
      )}

      {/* ===== Quartz advanced: day-of-week ===== */}
      {isQuartz && isDow && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <RadioGroupItem value="lastDay" id={`mode-lastDay-${fk}`} />
            <Label htmlFor={`mode-lastDay-${fk}`} className="text-sm cursor-pointer">
              {t.mode_lastDay_dow()}
            </Label>
            <Select
              value={String(lastDowN)}
              onValueChange={(v) => onPartChange(`${v}L`)}
              disabled={mode !== "lastDay"}
            >
              <SelectTrigger className="h-7 w-20 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {values.map((v) => (
                  <SelectItem key={v} value={String(v)} className="font-mono text-xs">
                    {dowLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground font-mono">(dowL)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RadioGroupItem value="nthDow" id={`mode-nthDow-${fk}`} />
            <Label htmlFor={`mode-nthDow-${fk}`} className="text-sm cursor-pointer">
              {t.mode_nthDow_prefix()}
            </Label>
            <Select
              value={String(nthDowInfo.nth)}
              onValueChange={(v) => onPartChange(`${nthDowInfo.dow}#${v}`)}
              disabled={mode !== "nthDow"}
            >
              <SelectTrigger className="h-7 w-16 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((v) => (
                  <SelectItem key={v} value={String(v)} className="font-mono text-xs">
                    {String(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{t.mode_nthDow_mid()}</span>
            <Select
              value={String(nthDowInfo.dow)}
              onValueChange={(v) => onPartChange(`${v}#${nthDowInfo.nth}`)}
              disabled={mode !== "nthDow"}
            >
              <SelectTrigger className="h-7 w-20 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {values.map((v) => (
                  <SelectItem key={v} value={String(v)} className="font-mono text-xs">
                    {dowLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground font-mono">(dow#N)</span>
          </div>
        </>
      )}
    </RadioGroup>
  );
}
