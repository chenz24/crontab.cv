import { getRouteApi } from "@tanstack/react-router";
import { fallback } from "@tanstack/zod-adapter";
import * as React from "react";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import { Crontab } from "@/components/Crontab";
import { useT } from "@/lib/i18n";
import { useCronStore } from "@/stores/cron-store";

export const homeSearchSchema = z.object({
  mode: fallback(z.enum(["vixie", "quartz"]), "vixie").default("vixie"),
  expr: fallback(z.string(), "* * * * *").default("* * * * *"),
  tz: fallback(z.string(), "UTC").default("UTC"),
  shell: fallback(z.string(), "/bin/bash").default("/bin/bash"),
  mailto: fallback(z.string(), "").default(""),
  cmd: fallback(z.string(), "/path/to/script.sh").default("/path/to/script.sh"),
  log: fallback(z.string(), "/var/log/task.log").default("/var/log/task.log"),
  logMode: fallback(z.enum(["append", "overwrite", "discard-err", "none"]), "append").default(
    "append",
  ),
  comment: fallback(z.string(), "").default(""),
  localTz: fallback(z.string(), "").default(""),
  dur: fallback(z.number().int().min(0), 0).default(0),
});

export type HomeSearch = z.infer<typeof homeSearchSchema>;

export function HomePage({ routeId }: { routeId: "/" | "/$locale/" }) {
  // routeId is a generic literal known to exist at runtime; cast to bypass deeply-typed routeId.
  const api = getRouteApi(routeId as any);
  const search = api.useSearch() as HomeSearch;
  const navigate = api.useNavigate() as any;

  // Hydrate store from URL once on mount (synchronously, before children render).
  const hydratedRef = React.useRef(false);
  if (!hydratedRef.current) {
    useCronStore.getState().hydrate({
      mode: search.mode,
      expr: search.expr,
      tz: search.tz,
      localTz: search.localTz,
      dur: search.dur,
      fileConfig: {
        shell: search.shell,
        mailto: search.mailto,
        cmd: search.cmd,
        log: search.log,
        logMode: search.logMode,
        comment: search.comment,
      },
    });
    hydratedRef.current = true;
  }

  // Subscribe to persistent slices of the store and mirror them to the URL.
  const persisted = useCronStore(
    useShallow((s) => ({
      mode: s.mode,
      expr: s.expr,
      tz: s.tz,
      localTz: s.localTz,
      dur: s.dur,
      fileConfig: s.fileConfig,
    })),
  );

  React.useEffect(() => {
    const { mode, expr, tz, localTz, dur, fileConfig } = persisted;
    if (
      mode === search.mode &&
      expr === search.expr &&
      tz === search.tz &&
      localTz === search.localTz &&
      dur === search.dur &&
      fileConfig.shell === search.shell &&
      fileConfig.mailto === search.mailto &&
      fileConfig.cmd === search.cmd &&
      fileConfig.log === search.log &&
      fileConfig.logMode === search.logMode &&
      fileConfig.comment === search.comment
    ) {
      return;
    }
    navigate({
      search: (prev: HomeSearch) => ({
        ...prev,
        mode,
        expr,
        tz,
        localTz,
        dur,
        shell: fileConfig.shell,
        mailto: fileConfig.mailto,
        cmd: fileConfig.cmd,
        log: fileConfig.log,
        logMode: fileConfig.logMode,
        comment: fileConfig.comment,
      }),
      replace: true,
      resetScroll: false,
    });
  }, [persisted, navigate, search]);

  const t = useT();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-10 max-w-3xl animate-fade-in">
        <span className="inline-block text-xs font-mono uppercase tracking-wider text-muted-foreground">
          {t.hero_eyebrow()}
        </span>
        <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">
          <span className="text-gradient">{t.hero_title_visual()}</span> {t.hero_title_cron_expr()}
          <br />
          <span className="text-foreground/70">{t.hero_title_easy()}</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">{t.hero_subtitle()}</p>
      </div>
      <Crontab />
    </div>
  );
}
