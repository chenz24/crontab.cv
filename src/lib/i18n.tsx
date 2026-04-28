import * as React from "react";
import { m } from "@/paraglide/messages";
import { baseLocale, type Locale, locales } from "@/paraglide/runtime";

const COOKIE_NAME = "PARAGLIDE_LOCALE";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const LocaleContext = React.createContext<Locale>(baseLocale as Locale);

export function LocaleProvider({ value, children }: { value: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return React.useContext(LocaleContext);
}

export type Messages = typeof m;

/**
 * Returns a Proxy over the compiled `m` namespace that auto-binds the active
 * locale from React context to every message call.
 *
 * Usage: `const t = useT(); t.nav_tool();`
 */
export function useT(): Messages {
  const locale = useLocale();
  return React.useMemo(() => {
    return new Proxy({} as Messages, {
      get(_target, key: string | symbol) {
        const fn = (m as Record<string | symbol, unknown>)[key];
        if (typeof fn !== "function") return fn;
        return (params: Record<string, unknown> = {}) =>
          (fn as (p: Record<string, unknown>, o: { locale: Locale }) => string)(params, { locale });
      },
    });
  }, [locale]);
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * Returns the URL prefix for a given locale. Empty string for the base locale,
 * "/{locale}" for everything else.
 */
export function localePrefix(locale: Locale): string {
  return locale === (baseLocale as Locale) ? "" : `/${locale}`;
}

/**
 * Strips a leading `/{locale}` segment from a pathname when it is one of the
 * non-base locales. Returns the un-prefixed pathname plus the detected locale
 * (or `null` if the path has no locale prefix).
 */
export function splitLocalePath(pathname: string): {
  locale: Locale | null;
  rest: string;
} {
  const m = pathname.match(/^\/([^/]+)(.*)$/);
  if (!m) return { locale: null, rest: pathname || "/" };
  const seg = m[1];
  if (seg === (baseLocale as string)) {
    // Treat /en/... as canonical-without-prefix; let routes handle.
    return { locale: null, rest: pathname };
  }
  if (isLocale(seg)) {
    return { locale: seg as Locale, rest: m[2] || "/" };
  }
  return { locale: null, rest: pathname };
}

/**
 * Builds a path with the given locale's prefix applied to a base-relative path.
 * Example: localizedPath("/about", "zh") => "/zh/about".
 */
export function localizedPath(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const prefix = localePrefix(locale);
  if (!prefix) return normalized;
  if (normalized === "/") return prefix;
  return `${prefix}${normalized}`;
}

/**
 * React hook returning a locale-aware path builder bound to the active locale.
 */
export function useLocalizedPath(): (path: string) => string {
  const locale = useLocale();
  return React.useCallback((path: string) => localizedPath(path, locale), [locale]);
}

/**
 * Detects the active locale on the client.
 *
 * Resolution order:
 *   1. URL pathname prefix (`/zh/...`, `/ja/...`, etc.) — authoritative when present.
 *   2. Otherwise the base locale.
 *
 * Cookie / browser language are intentionally NOT consulted here so that the
 * URL stays the single source of truth for the rendered locale. Browser-language
 * detection is only used by the language switcher when the user explicitly
 * opens the menu — see `setLocaleAndReload`.
 */
export function detectClientLocale(): Locale {
  if (typeof window !== "undefined") {
    const fromUrl = splitLocalePath(window.location.pathname).locale;
    if (fromUrl) return fromUrl;
  }
  return baseLocale as Locale;
}

/**
 * Persist a cookie hint and navigate the user to the URL of the chosen locale.
 * The cookie is purely informational (not used for resolution) and lets server
 * tooling know the user's preferred locale if needed in the future.
 */
export function setLocaleAndNavigate(locale: Locale) {
  if (typeof window === "undefined") return;
  if ("cookieStore" in window) {
    const expires = Date.now() + COOKIE_MAX_AGE * 1000;
    void window.cookieStore.set({
      name: COOKIE_NAME,
      value: locale,
      path: "/",
      expires,
      sameSite: "lax",
    });
  }
  const { pathname, search, hash } = window.location;
  const { rest } = splitLocalePath(pathname);
  const target = `${localizedPath(rest, locale)}${search}${hash}`;
  window.location.assign(target);
}
