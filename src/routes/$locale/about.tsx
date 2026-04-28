import { createFileRoute, notFound } from "@tanstack/react-router";
import { isLocale } from "@/lib/i18n";
import { AboutPage } from "@/pages/AboutPage";
import { baseLocale } from "@/paraglide/runtime";

export const Route = createFileRoute("/$locale/about")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale) || params.locale === baseLocale) throw notFound();
  },
  component: AboutPage,
});
