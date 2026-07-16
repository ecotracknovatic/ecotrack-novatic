/**
 * Forward + reverse geocoding.
 *
 * Uses OpenStreetMap's Nominatim public API — fine for development, but it's
 * rate-limited (~1 req/sec) and its usage policy prohibits sustained
 * production traffic. Before launch, swap the base URL / auth for a paid
 * geocoder (LocationIQ, Mapbox, Google) or a self-hosted Nominatim instance.
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export interface GeocodedAddress {
  latitude: number;
  longitude: number;
  formatted: string;
  town: string;
  lga: string;
  state: string;
  country: string;
}

export interface SearchResult extends GeocodedAddress {
  id: string;
}

function parseAddress(
  latitude: number,
  longitude: number,
  displayName: string,
  address: Record<string, string | undefined>,
): GeocodedAddress {
  return {
    latitude,
    longitude,
    formatted: displayName,
    town: address.town ?? address.city ?? address.village ?? address.suburb ?? "",
    // Nigerian LGAs surface inconsistently in OSM data — county and
    // state_district are the two fields that tend to carry it.
    lga: address.county ?? address.state_district ?? "",
    state: address.state ?? "",
    country: address.country ?? "",
  };
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<GeocodedAddress> {
  const url = new URL(`${NOMINATIM_BASE}/reverse`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error("Reverse geocoding failed");

  const data = await res.json();
  return parseAddress(latitude, longitude, data.display_name ?? "", data.address ?? {});
}

export async function searchLocations(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("q", query);

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error("Location search failed");

  const data: Array<{
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    address?: Record<string, string | undefined>;
  }> = await res.json();

  return data.map((item) => ({
    id: String(item.place_id),
    ...parseAddress(
      parseFloat(item.lat),
      parseFloat(item.lon),
      item.display_name,
      item.address ?? {},
    ),
  }));
}
