import type { Messages } from "@/lib/i18n";

// ---------- Helpers ----------
export function getBrowserTimezone(): string {
  if (typeof Intl === "undefined") return "UTC";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopy(text);
    }
  }
  return fallbackCopy(text);
}

function fallbackCopy(text: string): boolean {
  if (typeof document === "undefined") return false;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

export function isValueSelected(val: number, expr: string): boolean {
  if (expr === "*" || expr === "?") return true;
  for (const part of expr.split(",")) {
    const stepIdx = part.indexOf("/");
    let base = part;
    let step = 1;
    if (stepIdx !== -1) {
      step = parseInt(part.slice(stepIdx + 1), 10) || 1;
      base = part.slice(0, stepIdx);
    }
    let start: number;
    let end: number;
    if (base === "*") {
      start = -Infinity;
      end = Infinity;
    } else if (base.includes("-")) {
      const [s, e] = base.split("-").map((n) => parseInt(n, 10));
      start = s;
      end = e;
    } else {
      start = end = parseInt(base, 10);
    }
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    if (val < start || val > end) continue;
    if ((val - (Number.isFinite(start) ? start : 0)) % step === 0) return true;
  }
  return false;
}

// Expand a cron field expression (single field, no names) into its set of numeric values
// within [min, max]. Returns a sorted ascending array of unique integers.
export function expandCronPart(expr: string, min: number, max: number): number[] {
  const set = new Set<number>();
  if (!expr) return [];
  for (const raw of expr.split(",")) {
    const part = raw.trim();
    if (!part) continue;
    const stepIdx = part.indexOf("/");
    let base = part;
    let step = 1;
    if (stepIdx !== -1) {
      step = parseInt(part.slice(stepIdx + 1), 10) || 1;
      base = part.slice(0, stepIdx);
    }
    let start: number;
    let end: number;
    if (base === "*" || base === "?") {
      start = min;
      end = max;
    } else if (base.includes("-")) {
      const [s, e] = base.split("-").map((n) => parseInt(n, 10));
      if (Number.isNaN(s) || Number.isNaN(e)) continue;
      start = s;
      end = e;
    } else {
      const n = parseInt(base, 10);
      if (Number.isNaN(n)) continue;
      if (stepIdx !== -1) {
        // "N/step" means starting at N up to max
        start = n;
        end = max;
      } else {
        start = end = n;
      }
    }
    for (let v = start; v <= end; v += step) {
      if (v >= min && v <= max) set.add(v);
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

// Compact a sorted array of integers into a cron list string, using ranges for
// consecutive runs of length >= 3 (e.g. [5,6,7,8,9] -> "5-9", [5,6] -> "5,6").
// Returns "*" when the values cover the full [min, max] range.
export function compactCronValues(values: number[], min: number, max: number): string {
  if (values.length === 0) return "*";
  if (values.length === max - min + 1) return "*";
  const parts: string[] = [];
  let i = 0;
  while (i < values.length) {
    let j = i;
    while (j + 1 < values.length && values[j + 1] === values[j] + 1) j++;
    const runLen = j - i + 1;
    if (runLen >= 3) {
      parts.push(`${values[i]}-${values[j]}`);
    } else {
      for (let k = i; k <= j; k++) parts.push(String(values[k]));
    }
    i = j + 1;
  }
  return parts.join(",");
}

// ---------- Relative time ----------
export function relativeTime(date: Date, t: Messages): string {
  const diff = date.getTime() - Date.now();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return t.rel_seconds({ n: String(sec) });
  const min = Math.round(sec / 60);
  if (min < 60) return t.rel_minutes({ n: String(min) });
  const hr = Math.round(min / 60);
  if (hr < 24) return t.rel_hours({ n: String(hr) });
  const day = Math.round(hr / 24);
  if (day < 30) return t.rel_days({ n: String(day) });
  return t.rel_months({ n: String(Math.round(day / 30)) });
}

// ---------- Duration helpers ----------
export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  if (sec < 86400) {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return m === 0 ? `${h}h` : `${h}h${m}m`;
  }
  return `${Math.round(sec / 86400)}d`;
}
