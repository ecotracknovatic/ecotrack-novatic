import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TreeAlertRef {
  id: string;
  tag_code: string;
  health_status?: string;
}

export interface TreeAlerts {
  deadTrees: TreeAlertRef[];
  missingMonitoring: TreeAlertRef[];
  poorHealth: TreeAlertRef[];
  verificationRequired: TreeAlertRef[];
  replacementRequired: TreeAlertRef[];
  slowGrowth: TreeAlertRef[];
}

export function useTreeAlerts(organizationId?: string) {
  return useQuery({
    queryKey: ["tree_alerts", organizationId ?? "all"],
    queryFn: async (): Promise<TreeAlerts> => {
      const { data, error } = await supabase.rpc("get_tree_alerts", {
        p_organization_id: organizationId ?? null,
      });
      if (error) throw error;

      const raw = data as any;
      return {
        deadTrees: raw.dead_trees,
        missingMonitoring: raw.missing_monitoring,
        poorHealth: raw.poor_health,
        verificationRequired: raw.verification_required,
        replacementRequired: raw.replacement_required,
        slowGrowth: raw.slow_growth,
      };
    },
  });
}
