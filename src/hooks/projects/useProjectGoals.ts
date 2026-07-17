import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectGoal } from "@/types/project";

export function useProjectGoals(projectId: string) {
  return useQuery({
    queryKey: ["project_goals", projectId],
    queryFn: async (): Promise<ProjectGoal[]> => {
      const { data, error } = await supabase
        .from("project_goals")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { project_id: string; goal_type: "objective" | "outcome"; description: string }) => {
      const { error } = await supabase.from("project_goals").insert(input);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => qc.invalidateQueries({ queryKey: ["project_goals", variables.project_id] }),
  });
}

export function useToggleGoalAchieved() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isAchieved }: { id: string; projectId: string; isAchieved: boolean }) => {
      const { error } = await supabase.from("project_goals").update({ is_achieved: isAchieved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => qc.invalidateQueries({ queryKey: ["project_goals", variables.projectId] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; projectId: string }) => {
      const { error } = await supabase.from("project_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => qc.invalidateQueries({ queryKey: ["project_goals", variables.projectId] }),
  });
}
