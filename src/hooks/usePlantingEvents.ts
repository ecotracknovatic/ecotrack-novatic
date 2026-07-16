import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlantingEventOption {
  id: string;
  title: string;
  planting_date: string | null;
  latitude: number | null;
  longitude: number | null;
}

export function usePlantingEvents(projectId: string | null) {
  return useQuery({
    queryKey: ["planting_events", "by-project", projectId],
    queryFn: async (): Promise<PlantingEventOption[]> => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("planting_events")
        .select("id, title, planting_date, latitude, longitude")
        .eq("project_id", projectId)
        .order("planting_date", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}
