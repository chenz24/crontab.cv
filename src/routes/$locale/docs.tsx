import { createFileRoute, notFound } from "@tanstack/react-router";
import { isLocale } from "@/lib/i18n";
import { DocsPage } from "@/pages/DocsPage";
import { baseLocale } from "@/paraglide/runtime";

export const Route = createFileRoute("/$locale/docs")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale) || params.locale === baseLocale) throw notFound();
  },
  component: DocsPage,
});
