// ---------- Field metadata ----------

import type { Messages } from "@/lib/i18n";

export type CronMode = "vixie" | "quartz";

export type FieldKey = "second" | "minute" | "hour" | "dom" | "month" | "dow";

export type FieldColor = "cyan" | "violet" | "emerald" | "amber" | "rose" | "sky";

export interface FieldMeta {
  key: FieldKey;
  min: number;
  max: number;
  color: FieldColor;
}

export const FIELDS_VIXIE: readonly FieldMeta[] = [
  { key: "minute", min: 0, max: 59, color: "cyan" },
  { key: "hour", min: 0, max: 23, color: "violet" },
  { key: "dom", min: 1, max: 31, color: "emerald" },
  { key: "month", min: 1, max: 12, color: "amber" },
  { key: "dow", min: 0, max: 6, color: "rose" },
] as const;

export const FIELDS_QUARTZ: readonly FieldMeta[] = [
  { key: "second", min: 0, max: 59, color: "sky" },
  { key: "minute", min: 0, max: 59, color: "cyan" },
  { key: "hour", min: 0, max: 23, color: "violet" },
  { key: "dom", min: 1, max: 31, color: "emerald" },
  { key: "month", min: 1, max: 12, color: "amber" },
  { key: "dow", min: 1, max: 7, color: "rose" },
] as const;

export function getFields(mode: CronMode): readonly FieldMeta[] {
  return mode === "quartz" ? FIELDS_QUARTZ : FIELDS_VIXIE;
}

export function expectedLength(mode: CronMode): number {
  return mode === "quartz" ? 6 : 5;
}

/** Default expressions for each mode. */
export const DEFAULT_EXPR: Record<CronMode, string> = {
  vixie: "* * * * *",
  quartz: "0 * * * * ?",
};

/** Back-compat: default import kept for legacy call sites. */
export const FIELDS = FIELDS_VIXIE;

export const COLOR_VAR: Record<FieldColor, string> = {
  cyan: "var(--accent-cyan)",
  violet: "var(--accent-violet)",
  emerald: "var(--accent-emerald)",
  amber: "var(--accent-amber)",
  rose: "var(--accent-rose)",
  sky: "var(--accent-sky, var(--accent-cyan))",
};

/** Localized field display name. */
export function fieldName(t: Messages, key: FieldKey): string {
  switch (key) {
    case "second":
      return t.field_second();
    case "minute":
      return t.field_minute();
    case "hour":
      return t.field_hour();
    case "dom":
      return t.field_dom();
    case "month":
      return t.field_month();
    case "dow":
      return t.field_dow();
  }
}

/** Short label rendered under each cron field card. */
export function fieldShort(t: Messages, key: FieldKey): string {
  switch (key) {
    case "second":
      return t.field_short_sec();
    case "minute":
      return t.field_short_min();
    case "hour":
      return t.field_short_hour();
    case "dom":
      return t.field_short_day();
    case "month":
      return t.field_short_month();
    case "dow":
      return t.field_short_dow();
  }
}

export type PresetKey =
  | "preset_every_min"
  | "preset_every_hour"
  | "preset_midnight"
  | "preset_8am"
  | "preset_mon_9am"
  | "preset_first_of_month"
  | "preset_workday_hours"
  | "preset_every_15min";

export const PRESETS: ReadonlyArray<{ labelKey: PresetKey; val: string; icon: string }> = [
  { labelKey: "preset_every_min", val: "* * * * *", icon: "⏱" },
  { labelKey: "preset_every_hour", val: "0 * * * *", icon: "🕐" },
  { labelKey: "preset_midnight", val: "0 0 * * *", icon: "🌙" },
  { labelKey: "preset_8am", val: "0 8 * * *", icon: "☀" },
  { labelKey: "preset_mon_9am", val: "0 9 * * 1", icon: "📅" },
  { labelKey: "preset_first_of_month", val: "0 0 1 * *", icon: "🗓" },
  { labelKey: "preset_workday_hours", val: "0 9-18 * * 1-5", icon: "💼" },
  { labelKey: "preset_every_15min", val: "*/15 * * * *", icon: "⚡" },
] as const;

export interface TimezoneEntry {
  value: string;
  label: string;
  /** Optional message key for localized suffix; falls back to `label`. */
  labelKey?: "tz_label_shanghai" | "tz_label_tokyo";
}

export const TIMEZONES: readonly TimezoneEntry[] = [
  { value: "UTC", label: "UTC" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (Beijing)", labelKey: "tz_label_shanghai" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo", labelKey: "tz_label_tokyo" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
] as const;
