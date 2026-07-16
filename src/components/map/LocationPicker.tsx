import { useCallback, useEffect, useRef, useState } from "react";
import Map, {
  GeolocateControl,
  Marker,
  NavigationControl,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed, Loader2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reverseGeocode, searchLocations, type SearchResult } from "@/lib/geocoding";

// Nigeria-wide default view; recenters immediately once a value or GPS fix is available.
const FALLBACK_LATITUDE = 9.082;
const FALLBACK_LONGITUDE = 8.6753;
const FALLBACK_ZOOM = 5.5;
const SELECTED_ZOOM = 12;

/**
 * Dev-only OSM raster style. Swap the tile URL for a production tile
 * provider (MapTiler, Stadia Maps, self-hosted) before launch —
 * tile.openstreetmap.org is not for production traffic.
 */
const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm-tiles", type: "raster", source: "osm", minzoom: 0, maxzoom: 19 }],
};

export interface LocationPickerValue {
  latitude: number | null;
  longitude: number | null;
  location_name: string;
  town: string;
  lga: string;
  state: string;
  country: string;
}

export interface LocationPickerChange {
  latitude: number;
  longitude: number;
  location_name: string;
  town: string;
  lga: string;
  state: string;
  country: string;
}

interface LocationPickerProps {
  value: LocationPickerValue;
  onChange: (next: LocationPickerChange) => void;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const hasSelection = value.latitude !== null && value.longitude !== null;

  const [viewState, setViewState] = useState({
    latitude: value.latitude ?? FALLBACK_LATITUDE,
    longitude: value.longitude ?? FALLBACK_LONGITUDE,
    zoom: hasSelection ? SELECTED_ZOOM : FALLBACK_ZOOM,
  });

  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const reverseGeocodeAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const applyResolvedLocation = useCallback(
    (
      latitude: number,
      longitude: number,
      formatted: string,
      town: string,
      lga: string,
      state: string,
      country: string,
    ) => {
      setViewState((prev) => ({ ...prev, latitude, longitude, zoom: SELECTED_ZOOM }));
      onChange({
        latitude,
        longitude,
        // Only auto-fill the label if the user hasn't already typed a custom one.
        location_name: value.location_name || formatted,
        town,
        lga,
        state,
        country,
      });
    },
    [onChange, value.location_name],
  );

  const resolveCoordinates = useCallback(
    async (latitude: number, longitude: number) => {
      reverseGeocodeAbortRef.current?.abort();
      const controller = new AbortController();
      reverseGeocodeAbortRef.current = controller;

      setIsResolving(true);
      setError(null);
      try {
        const geocoded = await reverseGeocode(latitude, longitude, controller.signal);
        applyResolvedLocation(
          geocoded.latitude,
          geocoded.longitude,
          geocoded.formatted,
          geocoded.town,
          geocoded.lga,
          geocoded.state,
          geocoded.country,
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("Couldn't resolve that location. You can still drag the pin.");
        // Still save the raw coordinates even if reverse geocoding failed.
        setViewState((prev) => ({ ...prev, latitude, longitude, zoom: SELECTED_ZOOM }));
        onChange({
          latitude,
          longitude,
          location_name: value.location_name,
          town: value.town,
          lga: value.lga,
          state: value.state,
          country: value.country,
        });
      } finally {
        setIsResolving(false);
      }
    },
    [
      applyResolvedLocation,
      onChange,
      value.location_name,
      value.town,
      value.lga,
      value.state,
      value.country,
    ],
  );

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const { lat, lng } = event.lngLat;
      void resolveCoordinates(lat, lng);
    },
    [resolveCoordinates],
  );

  const handleMarkerDragEnd = useCallback(
    (event: { lngLat: { lat: number; lng: number } }) => {
      void resolveCoordinates(event.lngLat.lat, event.lngLat.lng);
    },
    [resolveCoordinates],
  );

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support GPS location.");
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        void resolveCoordinates(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setIsLocating(false);
        setError("Couldn't get your GPS location — check location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [resolveCoordinates]);

  // Search-as-you-type against the debounced query.
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setIsSearching(true);
    searchLocations(debouncedQuery, controller.signal)
      .then((found) => {
        setResults(found);
        setShowResults(true);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
      })
      .finally(() => setIsSearching(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      setQuery("");
      setShowResults(false);
      setResults([]);
      applyResolvedLocation(
        result.latitude,
        result.longitude,
        result.formatted,
        result.town,
        result.lga,
        result.state,
        result.country,
      );
    },
    [applyResolvedLocation],
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for a town, LGA, or address"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
          />
          {showResults && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectResult(result)}
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2 text-foreground">{result.formatted}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="shrink-0 gap-2"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Use my location</span>
        </Button>
      </div>

      <div className="relative h-64 w-full overflow-hidden rounded-lg border">
        <Map
          {...viewState}
          onMove={(e) => setViewState(e.viewState)}
          onClick={handleMapClick}
          mapStyle={OSM_RASTER_STYLE}
          style={{ width: "100%", height: "100%" }}
          attributionControl={{ compact: true }}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <GeolocateControl position="top-right" positionOptions={{ enableHighAccuracy: true }} />

          {hasSelection && (
            <Marker
              latitude={value.latitude!}
              longitude={value.longitude!}
              draggable
              onDragEnd={handleMarkerDragEnd}
              anchor="bottom"
            >
              <MapPin className="h-7 w-7 -translate-y-1 fill-emerald-600 text-emerald-800 drop-shadow" />
            </Marker>
          )}
        </Map>

        {isResolving && (
          <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-2 bg-background/90 py-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Resolving address…
          </div>
        )}

        {!hasSelection && !isResolving && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60">
            <p className="rounded-md bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
              Click the map, search, or use your GPS location
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
