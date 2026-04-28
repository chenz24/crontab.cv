import { Github, Moon, Sun } from "lucide-react";
import * as React from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocaleLink } from "@/components/LocaleLink";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useTheme } from "./ThemeProvider";

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3v18" />
      <path d="M4.2 7.5l15.6 9" />
      <path d="M19.8 7.5l-15.6 9" />
    </svg>
  );
}

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const t = useT();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const navItems = [
    { to: "/", label: t.nav_tool(), exact: true },
    { to: "/docs", label: t.nav_docs(), exact: false },
    { to: "/about", label: t.nav_about(), exact: false },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        <LocaleLink to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LogoMark className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">crontab.cv</span>
        </LocaleLink>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <LocaleLink
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              activeProps={{
                className: "text-foreground after:scale-x-100",
              }}
              inactiveProps={{
                className: "text-muted-foreground hover:text-foreground after:scale-x-0",
              }}
              className="relative px-3 py-2 text-sm font-medium after:absolute after:-bottom-px after:left-2 after:right-2 after:h-[2px] after:bg-primary after:transition-transform after:duration-150"
            >
              {item.label}
            </LocaleLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={mounted && theme === "dark" ? t.theme_to_light() : t.theme_to_dark()}
            className="h-8 w-8"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <span className="h-4 w-4" suppressHydrationWarning />
            )}
          </Button>
          <a
            href="https://github.com/chenz24/crontab.cv"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t.github()}
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex border-t border-border md:hidden">
        {navItems.map((item) => (
          <LocaleLink
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            activeProps={{ className: "text-foreground border-primary" }}
            inactiveProps={{ className: "text-muted-foreground border-transparent" }}
            className="flex-1 border-b-2 py-2.5 text-center text-sm font-medium"
          >
            {item.label}
          </LocaleLink>
        ))}
      </div>
    </header>
  );
}
