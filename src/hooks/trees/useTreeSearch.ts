import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TreeSearchParams {
  speciesId?: string;
  organizationId?: string;
  projectId?: string;
  healthStatus?: string;
  survivalStatus?: string;
  verificationStatus?: string;
  lga?: string;
  state?: string;
  gpsCenter?: { latitude: number; longitude: number; radiusKm: number };
  page?: number;
  pageSize?: number;
}

export interface TreeSearchResultRow {
  id: string;
  tag_code: string;
  health_status: string | null;
  survival_status: string | null;
  verification_status: string;
  species_id: string;
  project_id: string;
  town: string | null;
  lga: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

const DEFAULT_PAGE_SIZE = 25;

// GPS-radius search alone runs through a small RPC (ST_DWithin needs a
// geography cast PostgREST can't express via .filter()); all other filter
// combinations run as a normal PostgREST query, since they're plain
// equality filters on existing columns.
export function useTreeSearch(params: TreeSearchParams) {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  return useQuery({
    queryKey: ["tree_search", params],
    queryFn: async (): Promise<{ items: TreeSearchResultRow[]; totalCount: number }> => {
      if (params.gpsCenter) {
        const { data, error } = await supabase.rpc("search_trees_near", {
          p_latitude: params.gpsCenter.latitude,
          p_longitude: params.gpsCenter.longitude,
          p_radius_km: params.gpsCenter.radiusKm,
          p_species_id: params.speciesId ?? null,
          p_organization_id: params.organizationId ?? null,
          p_project_id: params.projectId ?? null,
        });
        if (error) throw error;
        const rows = (data ?? []) as TreeSearchResultRow[];
        return { items: rows, totalCount: rows.length };
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("trees")
        .select(
          "id, tag_code, health_status, survival_status, verification_status, species_id, project_id, town, lga, state, latitude, longitude, created_at",
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (params.speciesId) query = query.eq("species_id", params.speciesId);
      if (params.organizationId) query = query.eq("organization_id", params.organizationId);
      if (params.projectId) query = query.eq("project_id", params.projectId);
      if (params.healthStatus) query = query.eq("health_status", params.healthStatus);
      if (params.survivalStatus) query = query.eq("survival_status", params.survivalStatus);
      if (params.verificationStatus) query = query.eq("verification_status", params.verificationStatus);
      if (params.lga) query = query.eq("lga", params.lga);
      if (params.state) query = query.eq("state", params.state);

      const { data, error, count } = await query;
      if (error) throw error;

      return { items: (data ?? []) as TreeSearchResultRow[], totalCount: count ?? 0 };
    },
  });
}
