import { create } from "zustand";
import {
  type CronMode,
  DEFAULT_EXPR as DEFAULT_EXPR_BY_MODE,
  expectedLength,
} from "@/components/crontab/constants";

export type LogMode = "append" | "overwrite" | "discard-err" | "none";
export type K8sConcurrency = "Allow" | "Forbid" | "Replace";
export type { CronMode };

export interface CrontabFileConfig {
  shell: string;
  mailto: string;
  cmd: string;
  log: string;
  logMode: LogMode;
  comment: string;
}

export interface CronStateData {
  mode: CronMode;
  expr: string;
  tz: string;
  localTz: string;
  dur: number;
  fileConfig: CrontabFileConfig;
  k8sConcurrency: K8sConcurrency;
}

interface CronActions {
  setMode: (mode: CronMode) => void;
  setExpr: (expr: string) => void;
  setCronPart: (idx: number, value: string) => void;
  setTz: (tz: string) => void;
  setLocalTz: (localTz: string) => void;
  setDur: (dur: number) => void;
  updateFileConfig: (partial: Partial<CrontabFileConfig>) => void;
  setK8sConcurrency: (v: K8sConcurrency) => void;
  resetExpr: () => void;
  hydrate: (partial: Partial<CronStateData>) => void;
}

export type CronStore = CronStateData & CronActions;

export const DEFAULT_FILE_CONFIG: CrontabFileConfig = {
  shell: "/bin/bash",
  mailto: "",
  cmd: "/path/to/script.sh",
  log: "/var/log/task.log",
  logMode: "append",
  comment: "",
};

/** Ensure expr has the right number of fields for the given mode. */
function normalizeExpr(expr: string, mode: CronMode): string {
  const parts = expr.split(/\s+/).filter(Boolean);
  const n = expectedLength(mode);
  if (parts.length === n) return parts.join(" ");
  // Try to auto-convert from the other length.
  if (mode === "quartz" && parts.length === 5) return `0 ${parts.join(" ")}`;
  if (mode === "vixie" && parts.length === 6) return parts.slice(1).join(" ");
  return DEFAULT_EXPR_BY_MODE[mode];
}

/** Convert expr when switching mode, preserving the user's intent when possible. */
function convertExpr(expr: string, from: CronMode, to: CronMode): string {
  if (from === to) return expr;
  const parts = expr.split(/\s+/).filter(Boolean);
  if (to === "quartz" && parts.length === 5) {
    // Vixie → Quartz: prepend seconds=0. Day-of-week 0-6 → 1-7 where Sun=1.
    const [min, hour, dom, month, dow] = parts;
    const qDow = remapDow0to6To1to7(dow);
    // Quartz requires exactly one of dom/dow to be "?" — default dow to "?" when both are "*".
    let qDom = dom;
    let qDowFinal = qDow;
    if (qDom === "*" && qDowFinal === "*") qDowFinal = "?";
    else if (qDom !== "*" && qDowFinal !== "*") qDowFinal = "?";
    else if (qDom === "*") qDom = "?";
    else qDowFinal = "?";
    return `0 ${min} ${hour} ${qDom} ${month} ${qDowFinal}`;
  }
  if (to === "vixie" && parts.length === 6) {
    // Quartz → Vixie: drop seconds. Day-of-week 1-7 → 0-6. Replace "?" with "*".
    const [, min, hour, dom, month, dow] = parts;
    const vDow = remapDow1to7To0to6(dow === "?" ? "*" : dow);
    const vDom = dom === "?" ? "*" : dom;
    return `${min} ${hour} ${vDom} ${month} ${vDow}`;
  }
  return DEFAULT_EXPR_BY_MODE[to];
}

/** Remap a day-of-week field from Vixie (0-6, Sun=0) to Quartz (1-7, Sun=1). */
function remapDow0to6To1to7(s: string): string {
  if (s === "*" || s === "?") return s;
  return s.replace(/\b([0-6])\b/g, (_m, n) => String(parseInt(n, 10) + 1));
}

/** Remap a day-of-week field from Quartz (1-7, Sun=1) to Vixie (0-6, Sun=0). */
function remapDow1to7To0to6(s: string): string {
  if (s === "*" || s === "?") return s;
  return s.replace(/\b([1-7])\b/g, (_m, n) => String(parseInt(n, 10) - 1));
}

export const useCronStore = create<CronStore>((set, get) => ({
  mode: "vixie",
  expr: DEFAULT_EXPR_BY_MODE.vixie,
  tz: "UTC",
  localTz: "",
  dur: 0,
  fileConfig: { ...DEFAULT_FILE_CONFIG },
  k8sConcurrency: "Forbid",

  setMode: (mode) => {
    const s = get();
    if (s.mode === mode) return;
    set({ mode, expr: normalizeExpr(convertExpr(s.expr, s.mode, mode), mode) });
  },
  setExpr: (expr) => set((s) => ({ expr: normalizeExpr(expr, s.mode) })),
  setCronPart: (idx, value) => {
    const { expr, mode } = get();
    const parts = expr.split(/\s+/).filter(Boolean);
    if (parts.length !== expectedLength(mode)) return;
    parts[idx] = value || "*";
    set({ expr: parts.join(" ") });
  },
  setTz: (tz) => set({ tz }),
  setLocalTz: (localTz) => set({ localTz }),
  setDur: (dur) => set({ dur }),
  updateFileConfig: (partial) => set((s) => ({ fileConfig: { ...s.fileConfig, ...partial } })),
  setK8sConcurrency: (k8sConcurrency) => set({ k8sConcurrency }),
  resetExpr: () => set((s) => ({ expr: DEFAULT_EXPR_BY_MODE[s.mode] })),
  hydrate: (partial) => {
    const prev = get();
    const nextMode: CronMode = partial.mode ?? prev.mode;
    const next: Partial<CronStateData> = {};
    if (partial.mode !== undefined) next.mode = partial.mode;
    if (partial.expr !== undefined) next.expr = normalizeExpr(partial.expr, nextMode);
    else if (partial.mode !== undefined && partial.mode !== prev.mode) {
      next.expr = normalizeExpr(convertExpr(prev.expr, prev.mode, partial.mode), partial.mode);
    }
    if (partial.tz !== undefined) next.tz = partial.tz;
    if (partial.localTz !== undefined) next.localTz = partial.localTz;
    if (partial.dur !== undefined) next.dur = partial.dur;
    if (partial.k8sConcurrency !== undefined) next.k8sConcurrency = partial.k8sConcurrency;
    if (partial.fileConfig !== undefined) {
      next.fileConfig = { ...prev.fileConfig, ...partial.fileConfig };
    }
    set(next);
  },
}));

// Derived selector: parts array. Memoized via referential equality by reading string.
export const selectCronParts = (s: CronStore): string[] => s.expr.split(/\s+/).filter(Boolean);
