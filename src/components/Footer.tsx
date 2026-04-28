import { Github, Star, Terminal } from "lucide-react";
import { LocaleLink } from "@/components/LocaleLink";
import { useT } from "@/lib/i18n";

const REPO_URL = "https://github.com/chenz24/crontab.cv";
const ISSUES_URL = `${REPO_URL}/issues`;

const FRIEND_LINKS = [
  { name: "rename.tools", href: "https://rename.tools" },
  { name: "easing.tools", href: "https://easing.tools" },
  { name: "open-awesome.com", href: "https://open-awesome.com" },
];

export function Footer() {
  const t = useT();
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Terminal className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">crontab.cv</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t.footer_tagline()}</p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-foreground/80 hover:bg-accent hover:text-foreground"
          >
            <Star className="h-3.5 w-3.5" />
            {t.footer_star_on_github()}
          </a>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.footer_section_nav()}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <LocaleLink to="/" className="text-foreground/80 hover:text-foreground">
                {t.nav_tool()}
              </LocaleLink>
            </li>
            <li>
              <LocaleLink to="/docs" className="text-foreground/80 hover:text-foreground">
                {t.nav_docs()}
              </LocaleLink>
            </li>
            <li>
              <LocaleLink to="/about" className="text-foreground/80 hover:text-foreground">
                {t.nav_about()}
              </LocaleLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.footer_section_project()}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-foreground/80 hover:text-foreground"
              >
                <Github className="h-3.5 w-3.5" />
                {t.footer_link_repo()}
              </a>
            </li>
            <li>
              <a
                href={ISSUES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 hover:text-foreground"
              >
                {t.footer_link_issues()}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.footer_section_friends()}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {FRIEND_LINKS.map((f) => (
              <li key={f.href}>
                <a
                  href={f.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 hover:text-foreground"
                >
                  {f.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <p className="text-center text-xs text-muted-foreground">
            {t.footer_copyright({ year: String(new Date().getFullYear()) })}
          </p>
        </div>
      </div>
    </footer>
  );
}
