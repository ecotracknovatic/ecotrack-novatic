import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export function EcoTrackMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      const { data, error } = await supabase.from("projects").select("*");

      if (error) {
        console.error("Projects error:", error);
        return;
      }

      console.log(JSON.stringify(data?.[0], null, 2));
      setProjects(data ?? []);
    };

    loadProjects();

    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [7.6018, 12.9908],
      zoom: 8,
    });

    // Temporary marker
    new maplibregl.Marker().setLngLat([7.6018, 12.9908]).addTo(map);

    return () => map.remove();
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "600px",
        borderRadius: "12px",
      }}
    />
  );
}
