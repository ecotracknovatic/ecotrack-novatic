import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TreesOperationsDashboardStats {
  needingInspection: number;
  healthDistribution: Record<string, number>;
  maintenanceDue: number;
  averageHealthScore: number | null;
  averageInspectionsPerTree: number;
}

export function useTreesOperationsDashboardStats(organizationId?: string) {
  return useQuery({
    queryKey: ["trees_operations_dashboard_stats", organizationId ?? "all"],
    queryFn: async (): Promise<TreesOperationsDashboardStats> => {
      const { data, error } = await supabase.rpc("get_trees_operations_dashboard_stats", {
        p_organization_id: organizationId ?? null,
      });
      if (error) throw error;

      const raw = data as {
        needing_inspection: number;
        health_distribution: Record<string, number>;
        maintenance_due: number;
        average_health_score: number | null;
        average_inspections_per_tree: number;
      };

      return {
        needingInspection: raw.needing_inspection,
        healthDistribution: raw.health_distribution,
        maintenanceDue: raw.maintenance_due,
        averageHealthScore: raw.average_health_score,
        averageInspectionsPerTree: raw.average_inspections_per_tree,
      };
    },
  });
}
