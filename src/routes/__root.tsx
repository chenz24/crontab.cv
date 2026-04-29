import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  redirect,
  ScriptOnce,
  Scripts,
} from "@tanstack/react-router";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { isLocale, LocaleProvider, localizedPath, splitLocalePath, useT } from "@/lib/i18n";
import { m } from "@/paraglide/messages";
import { baseLocale, type Locale, locales } from "@/paraglide/runtime";
import faviconSvg from "@/assets/favicon.svg?url";
import appCss from "../styles.css?url";

const SITE_URL =
  ((import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_SITE_URL as string | undefined) ?? "https://crontab.cv";
const SITE_NAME = "crontab.cv";
const TWITTER_HANDLE = "@crontab_cv";

const HTML_LANG: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en",
  ja: "ja",
  fr: "fr",
  de: "de",
  es: "es",
};

const OG_LOCALE: Record<Locale, string> = {
  zh: "zh_CN",
  en: "en_US",
  ja: "ja_JP",
  fr: "fr_FR",
  de: "de_DE",
  es: "es_ES",
};

const themeBootScript = `(function(){try{var t=localStorage.getItem('crontab-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){document.documentElement.classList.add('dark');}})();`;

function NotFoundComponent() {
  const t = useT();
  const { locale } = Route.useRouteContext();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">{t.not_found_title()}</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t.not_found_subtitle()}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.not_found_description()}</p>
        <div className="mt-6">
          <Link
            to={localizedPath("/", locale)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.not_found_back_home()}
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  beforeLoad: ({ location }): { locale: Locale } => {
    const seg = location.pathname.split("/").filter(Boolean)[0];
    // /en/... is not canonical — base locale has no prefix. Redirect to the
    // unprefixed equivalent, preserving search + hash.
    if (seg === (baseLocale as string)) {
      // location.href is path+search+hash (no origin). Strip the `/en` prefix.
      const prefix = `/${seg}`;
      const rest = location.href.startsWith(prefix)
        ? location.href.slice(prefix.length) || "/"
        : "/";
      throw redirect({ href: rest, replace: true });
    }
    const locale: Locale =
      seg && isLocale(seg) && seg !== (baseLocale as string)
        ? (seg as Locale)
        : (baseLocale as Locale);
    return { locale };
  },
  head: ({ match }) => {
    const locale =
      (match.context as { locale?: Locale } | undefined)?.locale ?? (baseLocale as Locale);
    const pathname = (match as { pathname?: string }).pathname ?? "/";
    const { rest: basePath } = splitLocalePath(pathname);
    const pageType: "home" | "about" | "docs" | "unknown" =
      basePath === "/"
        ? "home"
        : basePath === "/about"
          ? "about"
          : basePath === "/docs"
            ? "docs"
            : "unknown";
    const isKnown = pageType !== "unknown";
    const pageMeta =
      pageType === "about"
        ? {
            title: m.about_meta_title({}, { locale }),
            description: m.about_meta_description({}, { locale }),
            ogDescription: m.about_meta_og_description({}, { locale }),
          }
        : pageType === "docs"
          ? {
              title: m.docs_meta_title({}, { locale }),
              description: m.docs_meta_description({}, { locale }),
              ogDescription: m.docs_meta_og_description({}, { locale }),
            }
          : {
              title: m.site_title({}, { locale }),
              description: m.site_description({}, { locale }),
              ogDescription: m.site_description({}, { locale }),
            };
    const canonicalHref = `${SITE_URL}${localizedPath(basePath, locale)}`;
    const ogImage = `${SITE_URL}/og-image.png`;

    // Per-page JSON-LD: WebSite is global; append page-type specific nodes.
    type SchemaNode = Record<string, unknown>;
    const graph: SchemaNode[] = [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: m.site_description({}, { locale }),
        inLanguage: HTML_LANG[locale],
      },
    ];
    if (pageType === "home") {
      graph.push({
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: SITE_NAME,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        url: SITE_URL,
        description: m.site_description({}, { locale }),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      });
    } else if (pageType === "docs") {
      graph.push(
        {
          "@type": "TechArticle",
          "@id": `${canonicalHref}#article`,
          headline: pageMeta.title,
          description: pageMeta.description,
          inLanguage: HTML_LANG[locale],
          isPartOf: { "@id": `${SITE_URL}/#website` },
          mainEntityOfPage: canonicalHref,
          author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: SITE_NAME,
              item: `${SITE_URL}${localizedPath("/", locale)}`,
            },
            { "@type": "ListItem", position: 2, name: pageMeta.title, item: canonicalHref },
          ],
        },
      );
    } else if (pageType === "about") {
      const faq = [
        { q: m.about_faq_q_privacy({}, { locale }), a: m.about_faq_a_privacy({}, { locale }) },
        { q: m.about_faq_q_dialect({}, { locale }), a: m.about_faq_a_dialect({}, { locale }) },
        { q: m.about_faq_q_seconds({}, { locale }), a: m.about_faq_a_seconds({}, { locale }) },
        { q: m.about_faq_q_offline({}, { locale }), a: m.about_faq_a_offline({}, { locale }) },
      ];
      graph.push(
        {
          "@type": "AboutPage",
          "@id": `${canonicalHref}#about`,
          name: pageMeta.title,
          description: pageMeta.description,
          inLanguage: HTML_LANG[locale],
          isPartOf: { "@id": `${SITE_URL}/#website` },
          url: canonicalHref,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: SITE_NAME,
              item: `${SITE_URL}${localizedPath("/", locale)}`,
            },
            { "@type": "ListItem", position: 2, name: pageMeta.title, item: canonicalHref },
          ],
        },
        {
          "@type": "FAQPage",
          "@id": `${canonicalHref}#faq`,
          mainEntity: faq.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        },
      );
    }
    const jsonLd = { "@context": "https://schema.org", "@graph": graph };

    const meta: Array<Record<string, string>> = [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: pageMeta.title },
      { name: "description", content: pageMeta.description },
      { name: "author", content: SITE_NAME },
      { name: "theme-color", content: "#0a0a0a" },
    ];
    if (!isKnown) {
      // 404 / unmatched route — keep it out of search results.
      meta.push({ name: "robots", content: "noindex,follow" });
    }
    meta.push(
      // Open Graph
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: pageMeta.title },
      { property: "og:description", content: pageMeta.ogDescription },
      { property: "og:url", content: canonicalHref },
      { property: "og:image", content: ogImage },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: pageMeta.title },
      { property: "og:locale", content: OG_LOCALE[locale] },
      ...(locales as readonly Locale[])
        .filter((l) => l !== locale)
        .map((l) => ({ property: "og:locale:alternate", content: OG_LOCALE[l] })),
      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: TWITTER_HANDLE },
      { name: "twitter:title", content: pageMeta.title },
      { name: "twitter:description", content: pageMeta.ogDescription },
      { name: "twitter:image", content: ogImage },
      { name: "twitter:image:alt", content: pageMeta.title },
    );

    const links: Array<Record<string, string>> = [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: faviconSvg },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
      },
    ];
    if (isKnown) {
      // Only emit canonical / hreflang for real pages — 404s shouldn't seed
      // bogus alternates back into the index.
      links.push(
        { rel: "canonical", href: canonicalHref },
        ...(locales as readonly Locale[]).map((loc) => ({
          rel: "alternate",
          hrefLang: HTML_LANG[loc],
          href: `${SITE_URL}${localizedPath(basePath, loc)}`,
        })),
        {
          rel: "alternate",
          hrefLang: "x-default",
          href: `${SITE_URL}${localizedPath(basePath, baseLocale as Locale)}`,
        },
      );
    }

    return {
      meta,
      links,
      scripts: isKnown
        ? [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }]
        : [],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const { locale } = Route.useRouteContext();
  return (
    <html lang={HTML_LANG[locale] ?? "en"} suppressHydrationWarning>
      <head>
        <HeadContent />
        <Analytics />
      </head>
      <body style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
        <ScriptOnce>{themeBootScript}</ScriptOnce>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { locale } = Route.useRouteContext();
  return (
    <LocaleProvider value={locale}>
      <ThemeProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
          <Toaster />
        </div>
      </ThemeProvider>
    </LocaleProvider>
  );
}
