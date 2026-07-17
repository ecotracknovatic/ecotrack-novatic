import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectsDashboardStats {
  activeProjects: number;
  treesPlanned: number;
  treesPlanted: number;
  survivalRate: number | null;
  budgetTotal: number;
  budgetSpent: number;
  upcomingMilestones: number;
  recentActivities: Array<{ id: string; title: string; project_id: string; activity_date: string; status: string }>;
}

export function useProjectsDashboardStats(organizationId?: string) {
  return useQuery({
    queryKey: ["projects_dashboard_stats", organizationId ?? "all"],
    queryFn: async (): Promise<ProjectsDashboardStats> => {
      const { data, error } = await supabase.rpc("get_projects_dashboard_stats", {
        p_organization_id: organizationId ?? null,
      });
      if (error) throw error;

      const raw = data as {
        active_projects: number;
        trees_planned: number;
        trees_planted: number;
        survival_rate: number | null;
        budget_total: number;
        budget_spent: number;
        upcoming_milestones: number;
        recent_activities: ProjectsDashboardStats["recentActivities"];
      };

      return {
        activeProjects: raw.active_projects,
        treesPlanned: raw.trees_planned,
        treesPlanted: raw.trees_planted,
        survivalRate: raw.survival_rate,
        budgetTotal: raw.budget_total,
        budgetSpent: raw.budget_spent,
        upcomingMilestones: raw.upcoming_milestones,
        recentActivities: raw.recent_activities,
      };
    },
  });
}
