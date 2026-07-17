import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Feature, Polygon } from "geojson";

export function useProjectBoundary(projectId: string) {
  return useQuery({
    queryKey: ["project_boundary", projectId],
    queryFn: async (): Promise<Polygon | null> => {
      const { data, error } = await supabase.rpc("get_project_boundary", { p_project_id: projectId });
      if (error) throw error;
      return (data as Polygon | null) ?? null;
    },
    enabled: !!projectId,
  });
}

export function useUpdateProjectBoundary() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, geometry }: { projectId: string; geometry: Feature<Polygon> | Polygon }) => {
      const geojson = "geometry" in geometry ? geometry.geometry : geometry;
      const { error } = await supabase.rpc("update_project_boundary", {
        p_project_id: projectId,
        p_geojson: geojson,
      });
      if (error) throw error;
    },
    onSuccess: (_d, variables) => qc.invalidateQueries({ queryKey: ["project_boundary", variables.projectId] }),
  });
}
