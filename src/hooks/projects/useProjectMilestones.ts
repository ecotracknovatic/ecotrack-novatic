import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { ProjectMilestone } from "@/types/project";

function invalidateMilestoneQueries(qc: ReturnType<typeof useQueryClient>, projectId: string) {
  qc.invalidateQueries({ queryKey: ["project_milestones", projectId] });
  qc.invalidateQueries({ queryKey: ["project_progress", projectId] });
}

export function useProjectMilestones(projectId: string) {
  return useQuery({
    queryKey: ["project_milestones", projectId],
    queryFn: async (): Promise<ProjectMilestone[]> => {
      const { data, error } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}

export interface MilestoneInput {
  project_id: string;
  title: string;
  description: string;
  due_date: string;
  order_index: number;
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: MilestoneInput) => {
      const { error } = await supabase.from("project_milestones").insert({
        project_id: input.project_id,
        title: input.title,
        description: input.description || null,
        due_date: input.due_date || null,
        order_index: input.order_index,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, variables) => invalidateMilestoneQueries(qc, variables.project_id),
  });
}

export function useUpdateMilestoneStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, status }: { id: string; projectId: string; status: string }) => {
      const { error } = await supabase.from("project_milestones").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => invalidateMilestoneQueries(qc, variables.projectId),
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; projectId: string }) => {
      const { error } = await supabase.from("project_milestones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => invalidateMilestoneQueries(qc, variables.projectId),
  });
}
