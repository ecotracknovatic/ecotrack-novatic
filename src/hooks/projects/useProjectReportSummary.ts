import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectProgress, ProjectMilestone, ProjectGoal } from "@/types/project";

export interface ProjectReportSummary {
  project: Record<string, unknown>;
  progress: ProjectProgress;
  milestones: ProjectMilestone[];
  goals: ProjectGoal[];
}

/**
 * Matches the shape convention established by useEventReportSummary. Not
 * wired into a specific PDF/CSV template — that lives in the Reports module,
 * which wasn't available to build against directly.
 */
export function useProjectReportSummary(projectId: string) {
  return useQuery({
    queryKey: ["project_report_summary", projectId],
    queryFn: async (): Promise<ProjectReportSummary> => {
      const { data, error } = await supabase.rpc("get_project_report_summary", { p_project_id: projectId });
      if (error) throw error;

      const raw = data as {
        project: Record<string, unknown>;
        progress: any;
        milestones: ProjectMilestone[];
        goals: ProjectGoal[];
      };

      return {
        project: raw.project,
        progress: {
          milestoneTotal: raw.progress.milestone_total,
          milestoneCompleted: raw.progress.milestone_completed,
          completionPercentage: raw.progress.completion_percentage,
          treeCount: raw.progress.tree_count,
          treesAlive: raw.progress.trees_alive,
          survivalRate: raw.progress.survival_rate,
          budgetTotal: raw.progress.budget_total,
          budgetSpent: raw.progress.budget_spent,
          fundingReceived: raw.progress.funding_received,
        },
        milestones: raw.milestones,
        goals: raw.goals,
      };
    },
    enabled: !!projectId,
  });
}
