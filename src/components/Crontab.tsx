import { CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue/i18n";
import { formatInTimeZone } from "date-fns-tz";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  ChevronRight,
  Copy,
  RefreshCw,
  Share2,
  Sparkles,
  Terminal,
  Timer,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatAwsEventBridge,
  formatCloudflareToml,
  formatGithubYaml,
  formatGitlabYaml,
  formatK8sYaml,
  formatSpringJava,
  formatVercelJson,
  type Platform,
  toAwsCron,
  toUtcCron,
} from "@/lib/cron-platforms";
import { useLocale, useT } from "@/lib/i18n";
import { selectCronParts, useCronStore } from "@/stores/cron-store";
import {
  COLOR_VAR,
  fieldName,
  fieldShort,
  getFields,
  PRESETS,
  TIMEZONES,
} from "./crontab/constants";
import { DualTimeRow } from "./crontab/DualTimeRow";
import { DurationBar } from "./crontab/DurationBar";
import { FieldModeEditor } from "./crontab/FieldModeEditor";
import { OutputPanel } from "./crontab/OutputPanel";
import { TimezoneBar } from "./crontab/TimezoneBar";
import {
  compactCronValues,
  copyText,
  expandCronPart,
  formatDuration,
  getBrowserTimezone,
  relativeTime,
} from "./crontab/utils";

export function Crontab() {
  // --- Store state ---
  const cronMode = useCronStore((s) => s.mode);
  const cronString = useCronStore((s) => s.expr);
  const cronParts = useCronStore(useShallow(selectCronParts));
  const tz = useCronStore((s) => s.tz);
  const localTz = useCronStore((s) => s.localTz);
  const dur = useCronStore((s) => s.dur);
  const fileConfig = useCronStore((s) => s.fileConfig);
  const k8sConcurrency = useCronStore((s) => s.k8sConcurrency);
  const setMode = useCronStore((s) => s.setMode);
  const setExpr = useCronStore((s) => s.setExpr);
  const setCronPart = useCronStore((s) => s.setCronPart);
  const setTz = useCronStore((s) => s.setTz);
  const setLocalTz = useCronStore((s) => s.setLocalTz);
  const setDur = useCronStore((s) => s.setDur);
  const updateFileConfig = useCronStore((s) => s.updateFileConfig);
  const setK8sConcurrency = useCronStore((s) => s.setK8sConcurrency);
  const resetExpr = useCronStore((s) => s.resetExpr);

  const t = useT();
  const locale = useLocale();
  const FIELDS = React.useMemo(() => getFields(cronMode), [cronMode]);
  const isQuartz = cronMode === "quartz";

  const browserTz = React.useMemo(() => getBrowserTimezone(), []);

  // Track client mount to avoid SSR/CSR mismatch for time-dependent values.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Seed localTz with the browser timezone on first render if the store had no value.
  const localTzSeededRef = React.useRef(false);
  if (!localTzSeededRef.current) {
    localTzSeededRef.current = true;
    if (!localTz) setLocalTz(browserTz);
  }

  // --- UI-only state (transient, not persisted) ---
  const [activeTab, setActiveTab] = React.useState(0);
  const [durUnit, setDurUnit] = React.useState<"s" | "m" | "h">(() => {
    if (dur === 0) return "m";
    if (dur % 3600 === 0) return "h";
    if (dur % 60 === 0) return "m";
    return "s";
  });
  const [copied, setCopied] = React.useState(false);

  // Detect Quartz-only extensions that cron-parser cannot evaluate.
  const hasQuartzExtensions = React.useMemo(
    () => /(\bL\b|\bLW\b|\d+W\b|\dL\b|#|\?|L-\d+)/.test(cronString),
    [cronString],
  );

  const cronstrueLocale =
    locale === "zh"
      ? "zh_CN"
      : locale === "ja"
        ? "ja"
        : locale === "fr"
          ? "fr"
          : locale === "de"
            ? "de"
            : locale === "es"
              ? "es"
              : "en";
  const { humanReadable, error } = React.useMemo(() => {
    try {
      const str = cronstrue.toString(cronString, {
        locale: cronstrueLocale,
        use24HourTimeFormat: true,
      });
      return { humanReadable: str, error: null as string | null };
    } catch (e) {
      return { humanReadable: "", error: e instanceof Error ? e.message : String(e) };
    }
  }, [cronString, cronstrueLocale]);

  const nextRuns = React.useMemo(() => {
    if (!mounted) return [];
    try {
      const interval = CronExpressionParser.parse(cronString, { tz });
      const arr: Date[] = [];
      for (let i = 0; i < 5; i++) arr.push(interval.next().toDate());
      return arr;
    } catch {
      return [];
    }
  }, [cronString, tz, mounted]);

  const updatePart = (idx: number, value: string) => {
    setCronPart(idx, value);
  };

  const handleCopyCron = async () => {
    const ok = await copyText(cronString);
    if (!ok) {
      toast.error(t.error_title());
      return;
    }
    setCopied(true);
    toast.success(t.toast_copied_expr());
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    resetExpr();
    setActiveTab(0);
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const ok = await copyText(window.location.href);
    if (!ok) {
      toast.error(t.error_title());
      return;
    }
    toast.success(t.toast_copied_share());
  };

  const toggleValue = (val: number) => {
    const current = cronParts[activeTab];
    const field = FIELDS[activeTab];
    if (current === "?") {
      setCronPart(activeTab, String(val));
      return;
    }
    // If current uses step syntax, replace wholesale to avoid silently expanding it.
    if (current.includes("/")) {
      setCronPart(activeTab, String(val));
      return;
    }
    const selected = new Set(expandCronPart(current, field.min, field.max));
    if (selected.has(val)) selected.delete(val);
    else selected.add(val);
    const sorted = Array.from(selected).sort((a, b) => a - b);
    setCronPart(activeTab, compactCronValues(sorted, field.min, field.max));
  };

  // For snippets / platforms, map parts by field.key to stay robust across modes.
  const partByKey = React.useMemo(() => {
    const m: Record<string, string> = {};
    FIELDS.forEach((f, i) => {
      m[f.key] = cronParts[i] ?? "*";
    });
    return m;
  }, [FIELDS, cronParts]);

  // Standard 5-field expression (used by non-Quartz snippets/platforms).
  const fiveFieldExpr = React.useMemo(() => {
    const dow = partByKey.dow ?? "*";
    const dom = partByKey.dom ?? "*";
    const vDow = isQuartz
      ? dow === "?"
        ? "*"
        : dow.replace(/\b([1-7])\b/g, (_m, n) => String(parseInt(n, 10) - 1))
      : dow;
    const vDom = dom === "?" ? "*" : dom;
    return `${partByKey.minute ?? "*"} ${partByKey.hour ?? "*"} ${vDom} ${partByKey.month ?? "*"} ${vDow}`;
  }, [partByKey, isQuartz]);

  const springExpr = isQuartz ? cronString : `0 ${cronString}`;

  const snippets = React.useMemo(
    () => [
      {
        lang: "Crontab",
        file: "crontab",
        code: `${fiveFieldExpr} /usr/bin/php /var/www/script.php`,
      },
      {
        lang: "Go (robfig/cron)",
        file: "main.go",
        code: `c := cron.New()\nc.AddFunc("${fiveFieldExpr}", func() {\n  fmt.Println("Run task")\n})\nc.Start()`,
      },
      {
        lang: "Node.js (node-cron)",
        file: "scheduler.ts",
        code: `import cron from 'node-cron';\n\ncron.schedule('${fiveFieldExpr}', () => {\n  console.log('Running task');\n});`,
      },
      {
        lang: "Python (APScheduler)",
        file: "jobs.py",
        code: `# Add a cron job\nscheduler.add_job(\n  job_function, 'cron',\n  minute='${partByKey.minute ?? "*"}', hour='${partByKey.hour ?? "*"}',\n  day='${(partByKey.dom ?? "*") === "?" ? "*" : partByKey.dom}', month='${partByKey.month ?? "*"}',\n  day_of_week='${(partByKey.dow ?? "*") === "?" ? "*" : partByKey.dow}'\n)`,
      },
      {
        lang: "Java (Spring)",
        file: "TaskRunner.java",
        code: `@Scheduled(cron = "${springExpr}")\npublic void scheduleTask() {\n  // ...\n}`,
      },
    ],
    [fiveFieldExpr, springExpr, partByKey],
  );

  const crontabFile = React.useMemo(() => {
    const lines: string[] = [];
    if (fileConfig.shell.trim()) lines.push(`SHELL=${fileConfig.shell.trim()}`);
    if (fileConfig.mailto.trim()) lines.push(`MAILTO=${fileConfig.mailto.trim()}`);
    if (lines.length > 0) lines.push("");
    const comment = fileConfig.comment.trim() || humanReadable;
    if (comment) lines.push(`# ${comment}`);
    const cmd = fileConfig.cmd.trim() || "/path/to/script.sh";
    const log = fileConfig.log.trim();
    let suffix = "";
    if (fileConfig.logMode !== "none" && log) {
      if (fileConfig.logMode === "append") suffix = ` >> ${log} 2>&1`;
      else if (fileConfig.logMode === "overwrite") suffix = ` > ${log} 2>&1`;
      else if (fileConfig.logMode === "discard-err") suffix = ` >> ${log} 2>/dev/null`;
    }
    lines.push(`${fiveFieldExpr} ${cmd}${suffix}`);
    return lines.join("\n");
  }, [fiveFieldExpr, fileConfig, humanReadable]);

  const activeColor = FIELDS[activeTab].color;
  const activeColorVar = COLOR_VAR[activeColor];

  const tzOptions = React.useMemo(() => {
    const all = new Map<string, string>();
    all.set(browserTz, `${browserTz} ${t.tz_browser_suffix()}`);
    for (const tzEntry of TIMEZONES) {
      if (all.has(tzEntry.value)) continue;
      const label = tzEntry.labelKey ? (t[tzEntry.labelKey] as () => string)() : tzEntry.label;
      all.set(tzEntry.value, label);
    }
    return Array.from(all.entries());
  }, [browserTz, t]);

  // ---- Dual timezone helpers ----
  const tzDiffMin = React.useMemo(() => {
    if (tz === localTz) return 0;
    try {
      const now = new Date();
      const a = formatInTimeZone(now, tz, "xxx");
      const b = formatInTimeZone(now, localTz, "xxx");
      const parse = (s: string) => {
        const m = /^([+-])(\d{2}):(\d{2})$/.exec(s);
        if (!m) return 0;
        return (m[1] === "-" ? -1 : 1) * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
      };
      return parse(a) - parse(b); // server - local
    } catch {
      return 0;
    }
  }, [tz, localTz]);

  const tzDiffLabel = React.useMemo(() => {
    if (tzDiffMin === 0) return t.tz_same();
    const sign = tzDiffMin > 0 ? "+" : "-";
    const abs = Math.abs(tzDiffMin);
    const h = Math.floor(abs / 60);
    const mm = abs % 60;
    return mm === 0 ? `${sign}${h}h` : `${sign}${h}h${mm}m`;
  }, [tzDiffMin, t]);

  // ---- Overlap detection ----
  const durSeconds = dur;
  const intervalSec = React.useMemo(() => {
    if (nextRuns.length < 2) return null;
    return Math.round((nextRuns[1].getTime() - nextRuns[0].getTime()) / 1000);
  }, [nextRuns]);

  const hasOverlap = React.useMemo(() => {
    if (!durSeconds || !intervalSec) return false;
    return durSeconds >= intervalSec;
  }, [durSeconds, intervalSec]);

  // ---- Platform code ----
  const platformSnippets = React.useMemo(() => {
    // Non-Quartz platforms use the converted 5-field expression.
    const utc = toUtcCron(fiveFieldExpr, tz, locale);
    const aws = toAwsCron(fiveFieldExpr, locale);
    const fiveOpts = { expr: fiveFieldExpr, tz, comment: fileConfig.comment, locale };
    const springOpts = {
      expr: isQuartz ? cronString : `0 ${cronString}`,
      tz,
      comment: fileConfig.comment,
      locale,
    };
    const quartzNote = isQuartz ? `\n# ⚠ ${t.plat_quartz_warn({ expr: cronString })}` : "";
    return {
      k8s: formatK8sYaml({ ...fiveOpts, concurrency: k8sConcurrency }) + quartzNote,
      github:
        formatGithubYaml({ ...fiveOpts, utcExpr: utc.expr, warning: utc.warning }) + quartzNote,
      gitlab: formatGitlabYaml(fiveOpts) + quartzNote,
      aws: formatAwsEventBridge({ ...fiveOpts, awsExpr: aws.expr, warning: aws.warning }),
      spring: formatSpringJava(springOpts),
      vercel:
        formatVercelJson({ ...fiveOpts, utcExpr: utc.expr, warning: utc.warning }) + quartzNote,
      cloudflare:
        formatCloudflareToml({ ...fiveOpts, utcExpr: utc.expr, warning: utc.warning }) + quartzNote,
    } as Record<Platform, string>;
  }, [fiveFieldExpr, cronString, isQuartz, tz, fileConfig.comment, k8sConcurrency, locale, t]);

  return (
    <div className="space-y-6">
      {/* ===== Hero ===== */}
      <section className="animate-fade-in">
        {/* Top title bar */}
        <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${error ? "bg-destructive animate-pulse" : "bg-success"}`}
            />
            <span className="font-mono text-xs lowercase text-muted-foreground">
              {error ? t.status_error() : t.status_live()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              title={t.mode_title()}
              className="inline-flex items-center rounded-md border border-border bg-card p-0.5 text-xs"
            >
              <button
                type="button"
                aria-pressed={!isQuartz}
                onClick={() => setMode("vixie")}
                className={`rounded px-2.5 py-1 font-mono transition-colors ${
                  !isQuartz
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={t.mode_vixie_title()}
              >
                Vixie (5)
              </button>
              <button
                type="button"
                aria-pressed={isQuartz}
                onClick={() => setMode("quartz")}
                className={`rounded px-2.5 py-1 font-mono transition-colors ${
                  isQuartz
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={t.mode_quartz_title()}
              >
                Quartz (6)
              </button>
            </div>
            <TimezoneBar
              tz={tz}
              localTz={localTz}
              browserTz={browserTz}
              tzDiffLabel={tzDiffLabel}
              tzOptions={tzOptions}
              onTzChange={setTz}
              onLocalTzChange={setLocalTz}
            />
          </div>
        </div>

        {/* Cron expression cards */}
        <div className="surface-card rounded-lg p-4 md:p-6">
          <div
            className="grid gap-2 md:gap-3"
            style={{ gridTemplateColumns: `repeat(${FIELDS.length}, minmax(0, 1fr))` }}
          >
            {FIELDS.map((field, idx) => {
              const isActive = activeTab === idx;
              const colorVar = COLOR_VAR[field.color];
              return (
                <label
                  key={field.key}
                  className="group relative flex cursor-text flex-col items-center rounded-md border bg-card p-3 pt-4 text-left transition-colors focus-within:ring-2 focus-within:ring-(--field-color) focus-within:ring-offset-1 focus-within:ring-offset-background"
                  style={{
                    borderColor: isActive ? colorVar : "var(--color-border)",
                    ["--field-color" as string]: colorVar,
                  }}
                >
                  {/* Top color bar */}
                  <span
                    className="absolute left-0 right-0 top-0 h-0.5 rounded-t-md"
                    style={{
                      background: isActive ? colorVar : "transparent",
                    }}
                  />
                  <input
                    type="text"
                    value={cronParts[idx]}
                    onChange={(e) => updatePart(idx, e.target.value)}
                    onFocus={() => setActiveTab(idx)}
                    aria-label={fieldName(t, field.key)}
                    className="w-full bg-transparent text-center font-mono text-2xl font-semibold text-foreground outline-none md:text-4xl"
                  />
                  <span className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium lowercase tracking-wide text-muted-foreground md:text-xs">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: colorVar }} />
                    {fieldShort(t, field.key)}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-border pt-3">
            <Button
              onClick={handleCopyCron}
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  {t.btn_copied()}
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  {t.btn_copy_expr()}
                </>
              )}
            </Button>
            <Button
              onClick={handleShare}
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              {t.btn_share()}
            </Button>
            <Button
              onClick={handleReset}
              size="sm"
              variant="outline"
              title={t.btn_reset_title()}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t.btn_reset()}
            </Button>
          </div>

          {/* Human readable */}
          <div className="mt-4">
            {error ? (
              <div className="flex items-start gap-3 rounded-md border-l-[3px] border-destructive bg-card p-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <span className="text-foreground">
                  <span className="font-medium text-destructive">{t.expr_invalid_prefix()}</span>
                  {error}
                </span>
              </div>
            ) : (
              <div
                key={cronString}
                className="animate-fade-in flex items-start gap-3 rounded-md border-l-[3px] bg-card p-3"
                style={{ borderLeftColor: activeColorVar }}
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm text-foreground md:text-base">{humanReadable}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== Two-column ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left col */}
        <div className="space-y-6 lg:col-span-2">
          {/* Visual editor */}
          <section className="surface-card animate-fade-in rounded-lg">
            {/* Tabs */}
            <div className="flex overflow-x-auto overflow-y-hidden border-b border-border">
              {FIELDS.map((field, idx) => {
                const isActive = activeTab === idx;
                const colorVar = COLOR_VAR[field.color];
                return (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`relative flex min-w-[80px] flex-1 items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium ${
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: colorVar }} />
                    {fieldName(t, field.key)}
                    {isActive && (
                      <span
                        className="absolute -bottom-px left-0 right-0 h-0.5"
                        style={{ background: colorVar }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {t.edit_field_label({ name: fieldName(t, FIELDS[activeTab].key) })}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyText(cronParts[activeTab]);
                    if (!ok) {
                      toast.error(t.error_title());
                      return;
                    }
                    toast.success(t.toast_copied_field());
                  }}
                  className="group flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1 font-mono text-xs text-foreground hover:border-foreground/30"
                >
                  <span className="text-muted-foreground">$</span>
                  {cronParts[activeTab]}
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>

              {/* Mode-driven field editor */}
              <FieldModeEditor
                field={FIELDS[activeTab]}
                cronMode={cronMode}
                cronPart={cronParts[activeTab]}
                colorVar={activeColorVar}
                onPartChange={(v) => updatePart(activeTab, v)}
                onToggle={toggleValue}
              />
            </div>
          </section>

          {/* Unified output panel: crontab file / code snippets / platforms */}
          <OutputPanel
            crontabFile={crontabFile}
            fileConfig={fileConfig}
            onFileConfigChange={updateFileConfig}
            snippets={snippets}
            platformSnippets={platformSnippets}
            k8sConcurrency={k8sConcurrency}
            onK8sConcurrencyChange={setK8sConcurrency}
          />
        </div>

        {/* Right col */}
        <div className="space-y-6">
          {/* Next runs timeline */}
          <section className="surface-card animate-fade-in rounded-lg">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">{t.next_runs_title()}</h2>
              </div>
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {tz}
              </span>
            </div>

            {/* Duration input */}
            <div className="border-b border-border p-3">
              <div className="flex items-center gap-2">
                <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="dur-input" className="text-xs text-muted-foreground">
                  {t.duration_label()}
                </Label>
                <Input
                  id="dur-input"
                  type="number"
                  min={0}
                  value={(() => {
                    if (dur === 0) return "";
                    if (durUnit === "h") return String(dur / 3600);
                    if (durUnit === "m") return String(dur / 60);
                    return String(dur);
                  })()}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    const mult = durUnit === "h" ? 3600 : durUnit === "m" ? 60 : 1;
                    setDur(Math.round(v * mult));
                  }}
                  placeholder="0"
                  className="h-7 w-20 font-mono text-xs"
                />
                <Select value={durUnit} onValueChange={(v) => setDurUnit(v as "s" | "m" | "h")}>
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s" className="text-xs">
                      {t.duration_unit_s()}
                    </SelectItem>
                    <SelectItem value="m" className="text-xs">
                      {t.duration_unit_m()}
                    </SelectItem>
                    <SelectItem value="h" className="text-xs">
                      {t.duration_unit_h()}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {intervalSec !== null && durSeconds > 0 && (
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {t.duration_interval_label({ value: formatDuration(intervalSec) })}
                  </span>
                )}
              </div>

              {hasOverlap && (
                <div
                  className="mt-2 flex items-start gap-2 rounded-md border-l-[3px] p-2 text-xs"
                  style={{
                    borderLeftColor: "var(--accent-rose)",
                    background: "color-mix(in oklab, var(--accent-rose) 6%, transparent)",
                  }}
                >
                  <AlertTriangle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    style={{ color: "var(--accent-rose)" }}
                  />
                  <span className="text-foreground">{t.overlap_warn()}</span>
                </div>
              )}
            </div>

            <div className="p-4">
              {nextRuns.length > 0 ? (
                <ol className="relative ml-1.5 space-y-3.5 border-l border-border pl-5">
                  {nextRuns.map((date, i) => {
                    const isFirst = i === 0;
                    const nextDate = nextRuns[i + 1];
                    const intervalToNext = nextDate
                      ? Math.round((nextDate.getTime() - date.getTime()) / 1000)
                      : intervalSec;
                    return (
                      <li key={date.getTime()} className="relative">
                        <span
                          className="absolute -left-6 top-1 block h-2 w-2 rounded-full"
                          style={{
                            background: isFirst ? activeColorVar : "transparent",
                            border: isFirst
                              ? `1px solid ${activeColorVar}`
                              : "1px solid var(--color-border)",
                          }}
                        />
                        <div>
                          {isFirst && (
                            <span className="mb-0.5 inline-block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {t.next_label()} · {mounted ? relativeTime(date, t) : "…"}
                            </span>
                          )}
                          <DualTimeRow date={date} serverTz={tz} localTz={localTz} />
                          {durSeconds > 0 && intervalToNext && (
                            <DurationBar dur={durSeconds} interval={intervalToNext} />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {mounted
                    ? hasQuartzExtensions
                      ? t.no_next_quartz()
                      : t.no_next_invalid()
                    : t.calculating()}
                </div>
              )}
            </div>
          </section>

          {/* Common presets */}
          <section className="surface-card animate-fade-in rounded-lg">
            <div className="flex items-center gap-2 border-b border-border p-4">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">{t.presets_title()}</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => {
                    setExpr(preset.val);
                    setActiveTab(0);
                  }}
                  className="group flex flex-col items-start gap-1 rounded-md border border-border bg-card p-2.5 text-left hover:border-foreground/25"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-base">{preset.icon}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {(t[preset.labelKey] as () => string)()}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">{preset.val}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
