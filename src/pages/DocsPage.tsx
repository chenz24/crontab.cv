import { Check, Copy } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { LocaleLink } from "@/components/LocaleLink";
import { type Messages, useT } from "@/lib/i18n";

const FIELD_COLORS = [
  "var(--accent-cyan)",
  "var(--accent-violet)",
  "var(--accent-emerald)",
  "var(--accent-amber)",
  "var(--accent-rose)",
];

const FIELD_ROWS: ReadonlyArray<{
  nameKey: keyof Messages;
  rangeKey?: keyof Messages;
  range?: string;
  special: string;
}> = [
  { nameKey: "docs_field_minute", range: "0-59", special: "* , - /" },
  { nameKey: "docs_field_hour", range: "0-23", special: "* , - /" },
  { nameKey: "docs_field_dom", rangeKey: "docs_range_dom", special: "* , - / ?" },
  { nameKey: "docs_field_month", rangeKey: "docs_range_month", special: "* , - /" },
  { nameKey: "docs_field_dow", rangeKey: "docs_range_dow", special: "* , - / ?" },
];

const SPECIAL_CHARS: ReadonlyArray<{
  char: string;
  nameKey: keyof Messages;
  descKey: keyof Messages;
}> = [
  { char: "*", nameKey: "docs_special_any", descKey: "docs_special_any_desc" },
  { char: ",", nameKey: "docs_special_list", descKey: "docs_special_list_desc" },
  { char: "-", nameKey: "docs_special_range", descKey: "docs_special_range_desc" },
  { char: "/", nameKey: "docs_special_step", descKey: "docs_special_step_desc" },
  { char: "?", nameKey: "docs_special_unspecified", descKey: "docs_special_unspecified_desc" },
];

const EXAMPLES: ReadonlyArray<{ expr: string; descKey: keyof Messages }> = [
  { expr: "* * * * *", descKey: "docs_ex_every_min" },
  { expr: "*/5 * * * *", descKey: "docs_ex_every_5min" },
  { expr: "0 * * * *", descKey: "docs_ex_every_hour" },
  { expr: "0 */2 * * *", descKey: "docs_ex_every_2hour" },
  { expr: "0 0 * * *", descKey: "docs_ex_midnight" },
  { expr: "0 8 * * *", descKey: "docs_ex_8am" },
  { expr: "30 18 * * *", descKey: "docs_ex_630pm" },
  { expr: "0 9-18 * * 1-5", descKey: "docs_ex_workday_9to18" },
  { expr: "0 0 * * 0", descKey: "docs_ex_sun_midnight" },
  { expr: "0 9 * * 1", descKey: "docs_ex_mon_9am" },
  { expr: "0 0 1 * *", descKey: "docs_ex_first_midnight" },
  { expr: "0 0 1,15 * *", descKey: "docs_ex_first_15" },
  { expr: "0 0 1 1 *", descKey: "docs_ex_jan_1st" },
  { expr: "0 12 * * 1-5", descKey: "docs_ex_workday_noon" },
  { expr: "*/10 9-17 * * 1-5", descKey: "docs_ex_workday_10min" },
  { expr: "0 22 * * 1-5", descKey: "docs_ex_workday_10pm" },
  { expr: "0 0,12 * * *", descKey: "docs_ex_0_12" },
  { expr: "15 14 1 * *", descKey: "docs_ex_first_1415" },
  { expr: "0 8 1-7 * 1", descKey: "docs_ex_first_mon" },
  { expr: "0 3 * * *", descKey: "docs_ex_3am_backup" },
];

const LIBRARIES = [
  { name: "node-cron (Node.js)", url: "https://www.npmjs.com/package/node-cron", emoji: "🟢" },
  { name: "APScheduler (Python)", url: "https://apscheduler.readthedocs.io/", emoji: "🐍" },
  { name: "robfig/cron (Go)", url: "https://github.com/robfig/cron", emoji: "🐹" },
  { name: "Quartz Scheduler (Java)", url: "http://www.quartz-scheduler.org/", emoji: "☕" },
  {
    name: "Spring @Scheduled",
    url: "https://docs.spring.io/spring-framework/reference/integration/scheduling.html",
    emoji: "🍃",
  },
  {
    name: "crontab (Linux)",
    url: "https://man7.org/linux/man-pages/man5/crontab.5.html",
    emoji: "🐧",
  },
  {
    name: "GitHub Actions schedule",
    url: "https://docs.github.com/actions/using-workflows/events-that-trigger-workflows#schedule",
    emoji: "🐙",
  },
  {
    name: "Kubernetes CronJob",
    url: "https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/",
    emoji: "☸️",
  },
  {
    name: "AWS EventBridge",
    url: "https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html",
    emoji: "☁️",
  },
  { name: "Vercel Cron Jobs", url: "https://vercel.com/docs/cron-jobs", emoji: "▲" },
  {
    name: "Cloudflare Workers Cron Triggers",
    url: "https://developers.cloudflare.com/workers/configuration/cron-triggers/",
    emoji: "🟧",
  },
];

const NICKNAMES: ReadonlyArray<{ alias: string; descKey: keyof Messages }> = [
  { alias: "@yearly", descKey: "docs_nick_yearly_desc" },
  { alias: "@annually", descKey: "docs_nick_yearly_desc" },
  { alias: "@monthly", descKey: "docs_nick_monthly_desc" },
  { alias: "@weekly", descKey: "docs_nick_weekly_desc" },
  { alias: "@daily", descKey: "docs_nick_daily_desc" },
  { alias: "@midnight", descKey: "docs_nick_daily_desc" },
  { alias: "@hourly", descKey: "docs_nick_hourly_desc" },
  { alias: "@reboot", descKey: "docs_nick_reboot_desc" },
];

const QUARTZ_EXTRAS: ReadonlyArray<{
  symbol: string;
  nameKey: keyof Messages;
  descKey: keyof Messages;
}> = [
  { symbol: "L", nameKey: "docs_quartz_l_name", descKey: "docs_quartz_l_desc" },
  { symbol: "W", nameKey: "docs_quartz_w_name", descKey: "docs_quartz_w_desc" },
  { symbol: "LW", nameKey: "docs_quartz_lw_name", descKey: "docs_quartz_lw_desc" },
  { symbol: "#", nameKey: "docs_quartz_hash_name", descKey: "docs_quartz_hash_desc" },
  { symbol: "?", nameKey: "docs_quartz_q_name", descKey: "docs_quartz_q_desc" },
];

const DIALECTS: ReadonlyArray<{
  nameKey: keyof Messages;
  fields: string;
  dow: string;
  extras: string | { messageKey: keyof Messages };
  notesKey: keyof Messages;
}> = [
  {
    nameKey: "docs_dialect_unix_name",
    fields: "5",
    dow: "0-6",
    extras: { messageKey: "docs_dialect_extras_none" },
    notesKey: "docs_dialect_unix_notes",
  },
  {
    nameKey: "docs_dialect_quartz_name",
    fields: "6-7",
    dow: "1-7",
    extras: "L W # ?",
    notesKey: "docs_dialect_quartz_notes",
  },
  {
    nameKey: "docs_dialect_aws_name",
    fields: "6",
    dow: "1-7",
    extras: "L W # ? + year",
    notesKey: "docs_dialect_aws_notes",
  },
  {
    nameKey: "docs_dialect_k8s_name",
    fields: "5",
    dow: "0-6",
    extras: { messageKey: "docs_dialect_extras_none" },
    notesKey: "docs_dialect_k8s_notes",
  },
  {
    nameKey: "docs_dialect_gha_name",
    fields: "5",
    dow: "0-6",
    extras: { messageKey: "docs_dialect_extras_none" },
    notesKey: "docs_dialect_gha_notes",
  },
];

const PITFALLS: ReadonlyArray<{ titleKey: keyof Messages; descKey: keyof Messages }> = [
  { titleKey: "docs_pitfall_dom_dow_title", descKey: "docs_pitfall_dom_dow_desc" },
  { titleKey: "docs_pitfall_tz_title", descKey: "docs_pitfall_tz_desc" },
  { titleKey: "docs_pitfall_step_title", descKey: "docs_pitfall_step_desc" },
  { titleKey: "docs_pitfall_short_title", descKey: "docs_pitfall_short_desc" },
];

const SECTIONS: ReadonlyArray<{ id: string; labelKey: keyof Messages }> = [
  { id: "fields", labelKey: "docs_section_fields" },
  { id: "specials", labelKey: "docs_section_specials" },
  { id: "nicknames", labelKey: "docs_section_nicknames" },
  { id: "quartz", labelKey: "docs_section_quartz" },
  { id: "dialects", labelKey: "docs_section_dialects" },
  { id: "examples", labelKey: "docs_section_examples" },
  { id: "pitfalls", labelKey: "docs_section_pitfalls" },
  { id: "libs", labelKey: "docs_section_libs" },
];

export function DocsPage() {
  const t = useT();
  const [copiedExpr, setCopiedExpr] = React.useState<string | null>(null);
  const handleCopy = React.useCallback(
    async (expr: string) => {
      try {
        await navigator.clipboard.writeText(expr);
        setCopiedExpr(expr);
        toast.success(t.docs_examples_copied());
        window.setTimeout(() => setCopiedExpr((c) => (c === expr ? null : c)), 1500);
      } catch {
        // ignore
      }
    },
    [t],
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_180px]">
        <div className="min-w-0 space-y-12">
          <header className="animate-fade-in">
            <span className="inline-block text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {t.docs_eyebrow()}
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t.docs_title()}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              {t.docs_intro_prefix()}
              <span className="mx-1 font-mono text-foreground">{t.docs_field_pattern()}</span>
            </p>
          </header>

          <section id="fields" className="animate-slide-up scroll-mt-20">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              {t.docs_section_fields()}
            </h2>
            <div className="surface-card overflow-hidden rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="px-4 py-2.5 font-semibold">{t.docs_table_field()}</th>
                    <th className="px-4 py-2.5 font-semibold">{t.docs_table_range()}</th>
                    <th className="px-4 py-2.5 font-semibold">{t.docs_table_special()}</th>
                  </tr>
                </thead>
                <tbody>
                  {FIELD_ROWS.map((row, i) => {
                    const name = (t[row.nameKey] as () => string)();
                    const range = row.rangeKey
                      ? (t[row.rangeKey] as () => string)()
                      : (row.range ?? "");
                    return (
                      <tr key={row.nameKey} className="border-t border-border">
                        <td className="px-4 py-2.5 font-medium text-foreground">
                          <span className="inline-flex items-center gap-2.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: FIELD_COLORS[i] }}
                            />
                            {name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{range}</td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">
                          {row.special}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section id="specials" className="animate-slide-up scroll-mt-20">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              {t.docs_section_specials()}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {SPECIAL_CHARS.map((c) => {
                const name = (t[c.nameKey] as () => string)();
                const desc = (t[c.descKey] as () => string)();
                return (
                  <div
                    key={c.char}
                    className="surface-card rounded-lg p-4 transition-colors hover:border-foreground/20"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-2xl font-semibold text-foreground">
                        {c.char}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{name}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="nicknames" className="animate-slide-up scroll-mt-20">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              {t.docs_section_nicknames()}
            </h2>
            <p className="mb-3 max-w-2xl text-sm text-muted-foreground">
              {t.docs_nicknames_intro()}
            </p>
            <div className="surface-card overflow-hidden rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="w-1/3 px-4 py-2.5 font-semibold">{t.docs_table_expr()}</th>
                    <th className="px-4 py-2.5 font-semibold">{t.docs_table_meaning()}</th>
                  </tr>
                </thead>
                <tbody>
                  {NICKNAMES.map((n) => {
                    const desc = (t[n.descKey] as () => string)();
                    return (
                      <tr key={n.alias} className="border-t border-border">
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-xs text-foreground">
                            {n.alias}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{desc}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section id="quartz" className="animate-slide-up scroll-mt-20">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              {t.docs_section_quartz()}
            </h2>
            <p className="mb-3 max-w-2xl text-sm text-muted-foreground">{t.docs_quartz_intro()}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {QUARTZ_EXTRAS.map((q) => {
                const name = (t[q.nameKey] as () => string)();
                const desc = (t[q.descKey] as () => string)();
                return (
                  <div
                    key={q.symbol}
                    className="surface-card rounded-lg p-4 transition-colors hover:border-foreground/20"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-2xl font-semibold text-foreground">
                        {q.symbol}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{name}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="dialects" className="animate-slide-up scroll-mt-20">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              {t.docs_section_dialects()}
            </h2>
            <p className="mb-3 max-w-2xl text-sm text-muted-foreground">
              {t.docs_dialects_intro()}
            </p>
            <div className="surface-card overflow-x-auto rounded-lg">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="px-4 py-2.5 font-semibold">{t.docs_table_dialect()}</th>
                    <th className="px-4 py-2.5 font-semibold">{t.docs_table_fields_count()}</th>
                    <th className="px-4 py-2.5 font-semibold">{t.docs_table_dow_range()}</th>
                    <th className="px-4 py-2.5 font-semibold">{t.docs_table_extras()}</th>
                    <th className="px-4 py-2.5 font-semibold">{t.docs_table_notes()}</th>
                  </tr>
                </thead>
                <tbody>
                  {DIALECTS.map((d) => {
                    const name = (t[d.nameKey] as () => string)();
                    const notes = (t[d.notesKey] as () => string)();
                    const extras =
                      typeof d.extras === "string"
                        ? d.extras
                        : (t[d.extras.messageKey] as () => string)();
                    return (
                      <tr key={d.nameKey} className="border-t border-border align-top">
                        <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">
                          {name}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{d.fields}</td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{d.dow}</td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                          {extras}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section id="examples" className="animate-slide-up scroll-mt-20">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              {t.docs_section_examples()}{" "}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {t.docs_examples_hint()}
              </span>
            </h2>
            <div className="surface-card overflow-hidden rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="w-1/3 px-4 py-2.5 font-semibold">{t.docs_table_expr()}</th>
                    <th className="px-4 py-2.5 font-semibold">{t.docs_table_meaning()}</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAMPLES.map((ex) => {
                    const desc = (t[ex.descKey] as () => string)();
                    const isCopied = copiedExpr === ex.expr;
                    return (
                      <tr key={ex.expr} className="group border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-2">
                          <div className="inline-flex items-center gap-1.5">
                            <LocaleLink
                              to="/"
                              search={{ expr: ex.expr, tz: "UTC" }}
                              className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-xs text-foreground hover:border-primary hover:text-primary"
                            >
                              {ex.expr}
                            </LocaleLink>
                            <button
                              type="button"
                              onClick={() => handleCopy(ex.expr)}
                              title={t.docs_examples_copy()}
                              aria-label={t.docs_examples_copy()}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-muted-foreground opacity-0 transition-opacity hover:border-border hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{desc}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section id="pitfalls" className="animate-slide-up scroll-mt-20">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              {t.docs_section_pitfalls()}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {PITFALLS.map((p) => {
                const title = (t[p.titleKey] as () => string)();
                const desc = (t[p.descKey] as () => string)();
                return (
                  <div
                    key={p.titleKey}
                    className="surface-card rounded-lg p-4 transition-colors hover:border-foreground/20"
                  >
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="libs" className="animate-slide-up scroll-mt-20">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              {t.docs_section_libs_title()}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {LIBRARIES.map((lib) => (
                <a
                  key={lib.url}
                  href={lib.url}
                  target="_blank"
                  rel="noreferrer"
                  className="surface-card group flex items-center gap-3 rounded-lg p-3 hover:border-foreground/20"
                >
                  <span className="text-lg">{lib.emoji}</span>
                  <span className="flex-1 text-sm font-medium text-foreground">{lib.name}</span>
                  <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </a>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.docs_toc()}
            </h3>
            <ul className="space-y-1 border-l border-border">
              {SECTIONS.map((s) => {
                const label = (t[s.labelKey] as () => string)();
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block border-l-2 border-transparent px-3 py-1 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
                    >
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
