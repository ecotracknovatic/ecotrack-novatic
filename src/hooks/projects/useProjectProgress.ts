import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectProgress } from "@/types/project";

export function useProjectProgress(projectId: string) {
  return useQuery({
    queryKey: ["project_progress", projectId],
    queryFn: async (): Promise<ProjectProgress> => {
      const { data, error } = await supabase.rpc("get_project_progress", { p_project_id: projectId });
      if (error) throw error;

      const raw = data as {
        milestone_total: number;
        milestone_completed: number;
        completion_percentage: number;
        tree_count: number;
        trees_alive: number;
        survival_rate: number | null;
        budget_total: number | null;
        budget_spent: number;
        funding_received: number;
      };

      return {
        milestoneTotal: raw.milestone_total,
        milestoneCompleted: raw.milestone_completed,
        completionPercentage: raw.completion_percentage,
        treeCount: raw.tree_count,
        treesAlive: raw.trees_alive,
        survivalRate: raw.survival_rate,
        budgetTotal: raw.budget_total,
        budgetSpent: raw.budget_spent,
        fundingReceived: raw.funding_received,
      };
    },
    enabled: !!projectId,
  });
}
