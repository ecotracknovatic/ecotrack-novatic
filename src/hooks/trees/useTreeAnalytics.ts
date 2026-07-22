import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrendPoint {
  month: string;
  [key: string]: string | number;
}

export interface PerformanceRow {
  tree_count: number;
  survival_rate: number | null;
  species_name?: string;
  project_name?: string;
}

export interface TreeAnalytics {
  growthTrend: TrendPoint[];
  survivalTrend: TrendPoint[];
  inspectionTrend: TrendPoint[];
  maintenanceTrend: TrendPoint[];
  speciesPerformance: PerformanceRow[];
  projectPerformance: PerformanceRow[];
}

export function useTreeAnalytics(organizationId?: string, months = 6) {
  return useQuery({
    queryKey: ["tree_analytics", organizationId ?? "all", months],
    queryFn: async (): Promise<TreeAnalytics> => {
      const { data, error } = await supabase.rpc("get_tree_analytics", {
        p_organization_id: organizationId ?? null,
        p_months: months,
      });
      if (error) throw error;

      const raw = data as any;
      return {
        growthTrend: raw.growth_trend,
        survivalTrend: raw.survival_trend,
        inspectionTrend: raw.inspection_trend,
        maintenanceTrend: raw.maintenance_trend,
        speciesPerformance: raw.species_performance,
        projectPerformance: raw.project_performance,
      };
    },
  });
}
