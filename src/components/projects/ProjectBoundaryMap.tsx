import { useCallback, useState } from "react";
import Map, { Source, Layer, NavigationControl, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { Loader2, Undo2, Trash2, Save } from "lucide-react";
import { OSM_RASTER_STYLE, DEFAULT_LATITUDE, DEFAULT_LONGITUDE, DEFAULT_ZOOM } from "@/components/map/mapStyles";

interface ProjectBoundaryMapProps {
  initialPolygon: GeoJSON.Polygon | null;
  onSave: (polygon: GeoJSON.Polygon) => void;
  isSaving: boolean;
}

export function ProjectBoundaryMap({ initialPolygon, onSave, isSaving }: ProjectBoundaryMapProps) {
  const [points, setPoints] = useState<[number, number][]>(
    initialPolygon ? (initialPolygon.coordinates[0].slice(0, -1) as [number, number][]) : [],
  );

  const center =
    points.length > 0
      ? points[points.length - 1]
      : ([DEFAULT_LONGITUDE, DEFAULT_LATITUDE] as [number, number]);

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    setPoints((prev) => [...prev, [e.lngLat.lng, e.lngLat.lat]]);
  }, []);

  const closedRing = points.length >= 3 ? [...points, points[0]] : points;

  const previewGeoJson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
      ...(points.length >= 2
        ? [
            {
              type: "Feature" as const,
              geometry: { type: "LineString" as const, coordinates: closedRing },
              properties: {},
            },
          ]
        : []),
      ...(points.length >= 3
        ? [
            {
              type: "Feature" as const,
              geometry: { type: "Polygon" as const, coordinates: [closedRing] },
              properties: {},
            },
          ]
        : []),
    ],
  };

  return (
    <div className="space-y-2">
      <div className="h-72 w-full overflow-hidden rounded-lg border">
        <Map
          initialViewState={{ longitude: center[0], latitude: center[1], zoom: points.length ? 13 : DEFAULT_ZOOM }}
          mapStyle={OSM_RASTER_STYLE as unknown as StyleSpecification}
          style={{ width: "100%", height: "100%" }}
          onClick={handleClick}
          attributionControl={{ compact: true }}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <Source id="boundary-preview" type="geojson" data={previewGeoJson}>
            <Layer
              id="boundary-fill"
              type="fill"
              filter={["==", ["geometry-type"], "Polygon"]}
              paint={{ "fill-color": "#16a34a", "fill-opacity": 0.25 }}
            />
            <Layer
              id="boundary-line"
              type="line"
              paint={{ "line-color": "#166534", "line-width": 2 }}
            />
          </Source>
        </Map>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Click the map to add boundary points ({points.length} added
          {points.length > 0 && points.length < 3 ? ` — need ${3 - points.length} more` : ""}).
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={points.length === 0}
            onClick={() => setPoints((prev) => prev.slice(0, -1))}
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={points.length === 0}
            onClick={() => setPoints([])}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1"
            disabled={points.length < 3 || isSaving}
            onClick={() => onSave({ type: "Polygon", coordinates: [closedRing] })}
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save boundary
          </Button>
        </div>
      </div>
    </div>
  );
}
