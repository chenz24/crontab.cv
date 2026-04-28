import { createFileRoute, notFound } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { isLocale } from "@/lib/i18n";
import { HomePage, homeSearchSchema } from "@/pages/HomePage";
import { baseLocale } from "@/paraglide/runtime";

export const Route = createFileRoute("/$locale/")({
  validateSearch: zodValidator(homeSearchSchema),
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale) || params.locale === baseLocale) throw notFound();
  },
  // Metadata (incl. og:*) is set by the root route.
  component: () => <HomePage routeId="/$locale/" />,
});
