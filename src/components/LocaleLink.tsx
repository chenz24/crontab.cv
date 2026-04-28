import { Link } from "@tanstack/react-router";
import type * as React from "react";
import { useLocalizedPath } from "@/lib/i18n";

type AnchorAttrs = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export type LocaleLinkProps = Omit<AnchorAttrs, "href"> & {
  to: string;
  // Loosely typed to accept TanStack Router specific props (search, hash,
  // params, replace, activeProps, …) without coupling to the typed route tree.
  [key: string]: any;
};

/**
 * A locale-aware drop-in for TanStack Router's `Link`. Pass a base-relative
 * path (e.g. "/", "/about") to `to`; the prefix for the active locale is
 * applied automatically (no prefix for the base locale).
 *
 * Typed routing is intentionally relaxed because the resolved path is
 * determined at runtime by the current locale.
 */
export function LocaleLink({ to, ...rest }: LocaleLinkProps) {
  const lp = useLocalizedPath();
  const LinkAny = Link as any;
  return <LinkAny {...rest} to={lp(to)} />;
}
