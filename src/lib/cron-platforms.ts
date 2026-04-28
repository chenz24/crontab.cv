/**
 * Cron platform code generators.
 *
 * Pure functions — no React, no DOM. Takes a 5-field standard cron expression
 * and emits configuration for various deployment platforms / CI systems.
 *
 * Comment / warning strings are pulled from Paraglide messages keyed by the
 * caller-supplied `locale`, so generated snippets follow the active UI locale.
 */

import { formatInTimeZone } from "date-fns-tz";
import { m } from "@/paraglide/messages";
import type { Locale } from "@/paraglide/runtime";

export type Platform = "k8s" | "github" | "gitlab" | "aws" | "spring" | "vercel" | "cloudflare";

export interface PlatformMeta {
  id: Platform;
  label: string;
  file: string;
  language: "yaml" | "json" | "java" | "toml";
  needsUtc: boolean;
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: "k8s",
    label: "Kubernetes CronJob",
    file: "cronjob.yaml",
    language: "yaml",
    needsUtc: false,
  },
  {
    id: "github",
    label: "GitHub Actions",
    file: ".github/workflows/schedule.yml",
    language: "yaml",
    needsUtc: true,
  },
  { id: "gitlab", label: "GitLab CI", file: ".gitlab-ci.yml", language: "yaml", needsUtc: false },
  {
    id: "aws",
    label: "AWS EventBridge",
    file: "eventbridge-rule.json",
    language: "json",
    needsUtc: false,
  },
  {
    id: "spring",
    label: "Spring @Scheduled",
    file: "ScheduledTask.java",
    language: "java",
    needsUtc: false,
  },
  { id: "vercel", label: "Vercel Cron", file: "vercel.json", language: "json", needsUtc: true },
  {
    id: "cloudflare",
    label: "Cloudflare Workers",
    file: "wrangler.toml",
    language: "toml",
    needsUtc: true,
  },
];

// ---------- Timezone shift to UTC ----------

function tzOffsetMinutes(tz: string, when: Date = new Date()): number {
  try {
    const off = formatInTimeZone(when, tz, "xxx");
    const re = /^([+-])(\d{2}):(\d{2})$/.exec(off);
    if (!re) return 0;
    const sign = re[1] === "-" ? -1 : 1;
    return sign * (parseInt(re[2], 10) * 60 + parseInt(re[3], 10));
  } catch {
    return 0;
  }
}

export function toUtcCron(
  expr: string,
  tz: string,
  locale: Locale,
): { expr: string; warning: string | null } {
  if (tz === "UTC" || tz === "Etc/UTC") return { expr, warning: null };
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return { expr, warning: null };
  const [minStr, hourStr, dom, month, dow] = parts;
  const offset = tzOffsetMinutes(tz);
  if (offset === 0) return { expr, warning: null };

  const isInt = (s: string) => /^\d+$/.test(s);
  const isStep = (s: string) => /^\*\/\d+$/.test(s);

  if ((minStr === "*" || isStep(minStr)) && (hourStr === "*" || isStep(hourStr))) {
    return { expr, warning: null };
  }

  if (isInt(minStr) && isInt(hourStr)) {
    const totalMinutes = parseInt(hourStr, 10) * 60 + parseInt(minStr, 10);
    let utcMinutes = totalMinutes - offset;
    let dayShift = 0;
    while (utcMinutes < 0) {
      utcMinutes += 24 * 60;
      dayShift -= 1;
    }
    while (utcMinutes >= 24 * 60) {
      utcMinutes -= 24 * 60;
      dayShift += 1;
    }
    const newHour = Math.floor(utcMinutes / 60);
    const newMin = utcMinutes % 60;
    const shifted = `${newMin} ${newHour} ${dom} ${month} ${dow}`;
    if (dayShift !== 0 && (dom !== "*" || dow !== "*")) {
      return {
        expr: shifted,
        warning: m.plat_tz_cross_day(
          { delta: `${dayShift > 0 ? "+" : ""}${dayShift}` },
          { locale },
        ),
      };
    }
    return { expr: shifted, warning: null };
  }

  if (minStr === "*" && isInt(hourStr)) {
    const offsetHours = Math.round(offset / 60);
    if (offset % 60 === 0) {
      let h = parseInt(hourStr, 10) - offsetHours;
      let dayShift = 0;
      while (h < 0) {
        h += 24;
        dayShift -= 1;
      }
      while (h >= 24) {
        h -= 24;
        dayShift += 1;
      }
      const shifted = `* ${h} ${dom} ${month} ${dow}`;
      return {
        expr: shifted,
        warning:
          dayShift !== 0 && (dom !== "*" || dow !== "*")
            ? m.plat_tz_cross_day_simple(
                { delta: `${dayShift > 0 ? "+" : ""}${dayShift}` },
                { locale },
              )
            : null,
      };
    }
  }

  return {
    expr,
    warning: m.plat_tz_complex({ hours: String(offset / 60) }, { locale }),
  };
}

// ---------- AWS EventBridge ----------

export function toAwsCron(expr: string, locale: Locale): { expr: string; warning: string | null } {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { expr: "0 0 * * ? *", warning: m.plat_aws_invalid({}, { locale }) };
  }
  const [min, hour, dom, month, dow] = parts;

  const remapDowBase = (base: string): string => {
    if (base === "*" || base === "?") return base;
    if (base.includes("-")) {
      const [a, b] = base.split("-");
      const ra = remapDowBase(a);
      const rb = remapDowBase(b);
      return `${ra}-${rb}`;
    }
    if (!/^\d+$/.test(base)) return base;
    const v = parseInt(base, 10);
    if (v < 0 || v > 7) return base;
    if (v === 0 || v === 7) return "1";
    return String(v + 1);
  };

  const shiftDow = (s: string): string => {
    if (s === "*" || s === "?") return s;
    return s
      .split(",")
      .map((segment) => {
        const [base, step] = segment.split("/");
        const mappedBase = remapDowBase(base);
        return step !== undefined ? `${mappedBase}/${step}` : mappedBase;
      })
      .join(",");
  };

  let awsDom = dom;
  let awsDow = shiftDow(dow);

  if (awsDom === "*" && awsDow === "*") {
    awsDow = "?";
  } else if (awsDom !== "*" && awsDow !== "*") {
    return {
      expr: `${min} ${hour} ${awsDom} ${month} ? *`,
      warning: m.plat_aws_dom_dow_conflict({}, { locale }),
    };
  } else if (awsDom === "*") {
    awsDom = "?";
  } else {
    awsDow = "?";
  }

  return { expr: `${min} ${hour} ${awsDom} ${month} ${awsDow} *`, warning: null };
}

// ---------- Formatters ----------

interface FmtOpts {
  expr: string;
  tz: string;
  comment: string;
  locale: Locale;
}

export function formatK8sYaml(
  o: FmtOpts & { concurrency: "Allow" | "Forbid" | "Replace" },
): string {
  const name = sanitizeName(o.comment) || "scheduled-task";
  return `apiVersion: batch/v1
kind: CronJob
metadata:
  name: ${name}
spec:
  schedule: "${o.expr}"
  timeZone: "${o.tz}"            # requires Kubernetes ≥ 1.27
  concurrencyPolicy: ${o.concurrency}
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: ${name}
              image: alpine:3
              command: ["/bin/sh", "-c"]
              args:
                - echo "Running ${name} at $(date)"`;
}

export function formatGithubYaml(o: FmtOpts & { utcExpr: string; warning: string | null }): string {
  const lines: string[] = [];
  lines.push(`name: ${sanitizeName(o.comment) || "scheduled"}`);
  lines.push("");
  if (o.warning) {
    lines.push("# ===== MANUAL CHECK REQUIRED =====");
    lines.push(`# ⚠ ${o.warning}`);
    lines.push("# Verify UTC schedule before using in production.");
  }
  lines.push(`# ${m.gen_orig_in_tz({ tz: o.tz, expr: o.expr }, { locale: o.locale })}`);
  lines.push(`# ${m.gen_github_utc_only({}, { locale: o.locale })}`);
  lines.push("on:");
  lines.push("  schedule:");
  lines.push(`    - cron: "${o.utcExpr}"   # UTC`);
  lines.push("");
  lines.push("jobs:");
  lines.push("  run:");
  lines.push("    runs-on: ubuntu-latest");
  lines.push("    steps:");
  lines.push("      - uses: actions/checkout@v4");
  lines.push("      - name: Run task");
  lines.push('        run: echo "Scheduled run at $(date -u)"');
  return lines.join("\n");
}

export function formatGitlabYaml(o: FmtOpts): string {
  return `# .gitlab-ci.yml
# ${m.gen_gitlab_note1({}, { locale: o.locale })}
# ${m.gen_gitlab_note2({}, { locale: o.locale })}
# ${m.gen_gitlab_note3({ expr: o.expr, tz: o.tz }, { locale: o.locale })}

scheduled_job:
  stage: build
  rules:
    - if: '$CI_PIPELINE_SOURCE == "schedule"'
  script:
    - echo "Running scheduled task — ${o.comment || "task"}"`;
}

export function formatAwsEventBridge(
  o: FmtOpts & { awsExpr: string; warning: string | null },
): string {
  const name = sanitizeName(o.comment) || "scheduled-rule";
  const obj = {
    Name: name,
    ScheduleExpression: `cron(${o.awsExpr})`,
    State: "ENABLED",
    Description: o.comment || `Cron: ${o.expr} (${o.tz})`,
  };
  const json = JSON.stringify(obj, null, 2);
  const cli = `aws events put-rule \\
  --name "${name}" \\
  --schedule-expression "cron(${o.awsExpr})" \\
  --state ENABLED`;
  const warn = o.warning ? `// ⚠ ${o.warning}\n` : "";
  return `${warn}// ${m.gen_aws_syntax({}, { locale: o.locale })}
// ${m.gen_orig_in_tz({ tz: o.tz, expr: o.expr }, { locale: o.locale })}
// ${m.gen_aws_converted({ expr: o.awsExpr }, { locale: o.locale })}
${json}

// ${m.gen_aws_cli_hint({}, { locale: o.locale })}
${cli}`;
}

export function formatSpringJava(o: FmtOpts): string {
  const className = pascalCase(o.comment) || "ScheduledTask";
  const springExpr = `0 ${o.expr}`;
  return `package com.example.tasks;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ${className} {

    // ${m.gen_spring_orig5({ expr: o.expr, tz: o.tz }, { locale: o.locale })}
    // ${m.gen_spring_six({ expr: springExpr }, { locale: o.locale })}
    @Scheduled(cron = "${springExpr}", zone = "${o.tz}")
    public void run() {
        // TODO: implement task
        System.out.println("Running scheduled task at " + java.time.Instant.now());
    }
}`;
}

export function formatVercelJson(o: FmtOpts & { utcExpr: string; warning: string | null }): string {
  const obj = {
    crons: [
      {
        path: "/api/cron",
        schedule: o.utcExpr,
      },
    ],
  };
  const warn = o.warning
    ? `// ===== MANUAL CHECK REQUIRED =====\n// ⚠ ${o.warning}\n// Verify UTC schedule before using in production.\n`
    : "";
  return `${warn}// ${m.gen_vercel_hint({}, { locale: o.locale })}
// ${m.gen_orig_in_tz({ tz: o.tz, expr: o.expr }, { locale: o.locale })}
// ${m.gen_converted_utc({ expr: o.utcExpr }, { locale: o.locale })}
// ${m.gen_vercel_handler({}, { locale: o.locale })}
${JSON.stringify(obj, null, 2)}`;
}

export function formatCloudflareToml(
  o: FmtOpts & { utcExpr: string; warning: string | null },
): string {
  const warn = o.warning
    ? `# ===== MANUAL CHECK REQUIRED =====\n# ⚠ ${o.warning}\n# Verify UTC schedule before using in production.\n`
    : "";
  return `${warn}# ${m.gen_cf_title({}, { locale: o.locale })}
# ${m.gen_orig_in_tz({ tz: o.tz, expr: o.expr }, { locale: o.locale })}
# ${m.gen_converted_utc({ expr: o.utcExpr }, { locale: o.locale })}

name = "${sanitizeName(o.comment) || "scheduled-worker"}"
main = "src/worker.ts"
compatibility_date = "2024-09-01"

[triggers]
crons = ["${o.utcExpr}"]

# src/worker.ts:
#
#   export default {
#     async scheduled(event, env, ctx) {
#       console.log("Cron fired at", new Date(event.scheduledTime).toISOString());
#     },
#   };`;
}

// ---------- helpers ----------

function sanitizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function pascalCase(s: string): string {
  const parts = s
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return "";
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join("")
    .slice(0, 60);
}
