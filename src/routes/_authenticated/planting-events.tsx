import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/planting-events")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_authenticated/planting-events"!</div>;
}
