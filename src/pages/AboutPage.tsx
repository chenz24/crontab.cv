import {
  ArrowRight,
  Code2,
  Github,
  Globe,
  Languages,
  Moon,
  MousePointerClick,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { LocaleLink } from "@/components/LocaleLink";
import { Button } from "@/components/ui/button";
import { type Messages, useT } from "@/lib/i18n";

const REPO_URL = "https://github.com/chenz24/crontab.cv";
const ISSUES_URL = `${REPO_URL}/issues`;

type FeatureKey = "translate" | "visual" | "code" | "tz" | "share" | "theme";

const FEATURES: ReadonlyArray<{
  key: FeatureKey;
  icon: typeof Languages;
  titleKey: keyof Messages;
  descKey: keyof Messages;
}> = [
  {
    key: "translate",
    icon: Languages,
    titleKey: "about_feat_translate",
    descKey: "about_feat_translate_desc",
  },
  {
    key: "visual",
    icon: MousePointerClick,
    titleKey: "about_feat_visual",
    descKey: "about_feat_visual_desc",
  },
  { key: "code", icon: Code2, titleKey: "about_feat_code", descKey: "about_feat_code_desc" },
  { key: "tz", icon: Globe, titleKey: "about_feat_tz", descKey: "about_feat_tz_desc" },
  { key: "share", icon: Share2, titleKey: "about_feat_share", descKey: "about_feat_share_desc" },
  { key: "theme", icon: Moon, titleKey: "about_feat_theme", descKey: "about_feat_theme_desc" },
];

const STACK_GROUPS: ReadonlyArray<{ titleKey: keyof Messages; items: readonly string[] }> = [
  {
    titleKey: "about_stack_frontend",
    items: ["TanStack Start (SSR)", "React 19", "Tailwind CSS v4"],
  },
  { titleKey: "about_stack_core", items: ["cronstrue", "cron-parser", "date-fns-tz"] },
  { titleKey: "about_stack_ui", items: ["shadcn/ui", "lucide-react", "sonner"] },
];

const FAQ_ITEMS: ReadonlyArray<{ qKey: keyof Messages; aKey: keyof Messages }> = [
  { qKey: "about_faq_q_privacy", aKey: "about_faq_a_privacy" },
  { qKey: "about_faq_q_dialect", aKey: "about_faq_a_dialect" },
  { qKey: "about_faq_q_seconds", aKey: "about_faq_a_seconds" },
  { qKey: "about_faq_q_offline", aKey: "about_faq_a_offline" },
];

export function AboutPage() {
  const t = useT();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <div className="animate-fade-in space-y-14">
        {/* Hero */}
        <section className="text-center">
          <span className="inline-block text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {t.about_eyebrow()}
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            {t.about_title()} <span className="text-gradient">crontab.cv</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            {t.about_subtitle()}
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild size="default" className="gap-2">
              <LocaleLink to="/">
                {t.about_get_started()}
                <ArrowRight className="h-4 w-4" />
              </LocaleLink>
            </Button>
          </div>
        </section>

        {/* Why */}
        <section className="surface-card rounded-lg p-6 md:p-8">
          <h2 className="text-base font-semibold text-foreground">{t.about_why_title()}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.about_why_p1()}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.about_why_p2()}</p>
        </section>

        {/* Features */}
        <section>
          <h2 className="mb-4 text-base font-semibold text-foreground">
            {t.about_features_title()}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              const title = (t[f.titleKey] as () => string)();
              const desc = (t[f.descKey] as () => string)();
              return (
                <div
                  key={f.key}
                  className="surface-card rounded-lg p-5 transition-colors hover:border-foreground/20"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Privacy */}
        <section className="flex items-start gap-4 rounded-lg border border-border bg-card/50 p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t.about_privacy_title()}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.about_privacy_desc()}</p>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="mb-4 text-base font-semibold text-foreground">{t.about_faq_title()}</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => {
              const q = (t[item.qKey] as () => string)();
              const a = (t[item.aKey] as () => string)();
              return (
                <details
                  key={item.qKey}
                  className="surface-card group rounded-lg p-4 transition-colors hover:border-foreground/20"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground">
                    <span>{q}</span>
                    <span className="text-muted-foreground transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
                </details>
              );
            })}
          </div>
        </section>

        {/* Tech stack */}
        <section>
          <h2 className="mb-4 text-base font-semibold text-foreground">{t.about_stack_title()}</h2>
          <div className="space-y-4">
            {STACK_GROUPS.map((g) => {
              const title = (t[g.titleKey] as () => string)();
              return (
                <div key={g.titleKey}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-xs text-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feedback */}
        <section className="surface-card rounded-lg p-6 text-center md:p-8">
          <h2 className="text-base font-semibold text-foreground">{t.about_feedback_title()}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.about_feedback_desc()}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="outline" asChild>
              <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
                <Github className="mr-1.5 h-4 w-4" />
                {t.footer_link_issues()}
              </a>
            </Button>
            <Button asChild>
              <LocaleLink to="/docs">{t.about_view_docs()}</LocaleLink>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              {t.about_license_label()}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
