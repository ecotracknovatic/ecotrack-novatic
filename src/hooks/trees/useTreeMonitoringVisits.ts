import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TreeMonitoringVisit {
  id: string;
  tree_id: string;
  inspector_id: string | null;
  visit_date: string;
  latitude: number | null;
  longitude: number | null;
  weather_notes: string | null;
  notes: string | null;
  recommendations: string | null;
  ai_health_score: number | null;
  ai_confidence: number | null;
  ai_recommendations: string | null;
  ai_disease_prediction: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export function useTreeMonitoringVisits(treeId: string) {
  return useQuery({
    queryKey: ["tree_monitoring_visits", treeId],
    queryFn: async (): Promise<TreeMonitoringVisit[]> => {
      const { data, error } = await supabase
        .from("tree_monitoring_visits")
        .select("*, profiles(full_name)")
        .eq("tree_id", treeId)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data as unknown as TreeMonitoringVisit[];
    },
    enabled: !!treeId,
  });
}
