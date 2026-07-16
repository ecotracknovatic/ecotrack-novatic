import { createFileRoute } from "@tanstack/react-router";
import { EcoTrackMap } from "@/components/map/EcoTrackMap";
export const Route = createFileRoute("/_authenticated/maps")({
  component: MapsPage,
});

function MapsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">EcoTrack Map</h1>

      <EcoTrackMap />
    </div>
  );
}
