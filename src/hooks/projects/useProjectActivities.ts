import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { ProjectActivity } from "@/types/project";

export function useProjectActivities(projectId: string) {
  return useQuery({
    queryKey: ["project_activities", projectId],
    queryFn: async (): Promise<ProjectActivity[]> => {
      const { data, error } = await supabase
        .from("project_activities")
        .select("*")
        .eq("project_id", projectId)
        .order("activity_date", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { project_id: string; title: string; description: string; activity_date: string }) => {
      const { error } = await supabase.from("project_activities").insert({
        project_id: input.project_id,
        title: input.title,
        description: input.description || null,
        activity_date: input.activity_date,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, variables) => qc.invalidateQueries({ queryKey: ["project_activities", variables.project_id] }),
  });
}

export function useUpdateActivityStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; projectId: string; status: string }) => {
      const { error } = await supabase.from("project_activities").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => qc.invalidateQueries({ queryKey: ["project_activities", variables.projectId] }),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; projectId: string }) => {
      const { error } = await supabase.from("project_activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => qc.invalidateQueries({ queryKey: ["project_activities", variables.projectId] }),
  });
}
