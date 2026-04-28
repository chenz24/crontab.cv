import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { HomePage, homeSearchSchema } from "@/pages/HomePage";

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(homeSearchSchema),
  // Metadata (incl. og:*) is set by the root route.
  component: () => <HomePage routeId="/" />,
});
