import { useMemo, useState } from "react";
import Map, { Source, Layer, NavigationControl, Popup, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { OSM_RASTER_STYLE, DEFAULT_LATITUDE, DEFAULT_LONGITUDE, DEFAULT_ZOOM } from "@/components/map/mapStyles";
import { useTreeSearch, type TreeSearchParams } from "@/hooks/trees/useTreeSearch";
import { TreeMonitoringMapPopup } from "@/components/trees/TreeMonitoringMapPopup";

const HEALTH_COLORS: Record<string, string> = {
  Healthy: "#16a34a",
  healthy: "#16a34a",
  "Needs Attention": "#d97706",
  needs_attention: "#d97706",
  Diseased: "#ea580c",
  diseased: "#ea580c",
  Dead: "#dc2626",
  dead: "#dc2626",
};

export function TreesClusterMap({ filters }: { filters?: TreeSearchParams }) {
  const trees = useTreeSearch({ ...filters, pageSize: 500 });
  const [popupTree, setPopupTree] = useState<{ id: string; tag_code: string; health_status: string | null; longitude: number; latitude: number } | null>(null);

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: (trees.data?.items ?? [])
        .filter((t) => t.latitude !== null && t.longitude !== null)
        .map((t) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [t.longitude!, t.latitude!] },
          properties: { id: t.id, tag_code: t.tag_code, health_status: t.health_status ?? "unknown" },
        })),
    }),
    [trees.data],
  );

  const handleClick = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature || feature.geometry.type !== "Point") return;
    const [lng, lat] = feature.geometry.coordinates;
    setPopupTree({
      id: feature.properties?.id,
      tag_code: feature.properties?.tag_code,
      health_status: feature.properties?.health_status,
      longitude: lng,
      latitude: lat,
    });
  };

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-lg border">
      <Map
        initialViewState={{ latitude: DEFAULT_LATITUDE, longitude: DEFAULT_LONGITUDE, zoom: DEFAULT_ZOOM }}
        mapStyle={OSM_RASTER_STYLE as unknown as StyleSpecification}
        style={{ width: "100%", height: "100%" }}
        interactiveLayerIds={["tree-points"]}
        onClick={handleClick}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-right" />

        <Source id="trees" type="geojson" data={geojson} cluster={true} clusterRadius={50} clusterMaxZoom={14}>
          <Layer
            id="tree-clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": "#16a34a",
              "circle-radius": ["step", ["get", "point_count"], 16, 25, 22, 100, 28],
              "circle-opacity": 0.75,
            }}
          />
          <Layer
            id="tree-cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{ "text-field": "{point_count_abbreviated}", "text-size": 12 }}
            paint={{ "text-color": "#ffffff" }}
          />
          <Layer
            id="tree-points"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-radius": 6,
              "circle-color": [
                "match",
                ["get", "health_status"],
                "Healthy", HEALTH_COLORS.healthy,
                "healthy", HEALTH_COLORS.healthy,
                "Needs Attention", HEALTH_COLORS.needs_attention,
                "needs_attention", HEALTH_COLORS.needs_attention,
                "Diseased", HEALTH_COLORS.diseased,
                "diseased", HEALTH_COLORS.diseased,
                "Dead", HEALTH_COLORS.dead,
                "dead", HEALTH_COLORS.dead,
                "#94a3b8",
              ],
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#ffffff",
            }}
          />
        </Source>

        {popupTree && (
          <Popup
            longitude={popupTree.longitude}
            latitude={popupTree.latitude}
            onClose={() => setPopupTree(null)}
            closeOnClick={false}
          >
            <TreeMonitoringMapPopup
              treeId={popupTree.id}
              tagCode={popupTree.tag_code}
              healthStatus={popupTree.health_status}
            />
          </Popup>
        )}
      </Map>

      {trees.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm text-muted-foreground">
          Loading trees…
        </div>
      )}
    </div>
  );
}
