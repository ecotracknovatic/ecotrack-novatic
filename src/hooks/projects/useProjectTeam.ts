import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectTeamMember } from "@/types/project";

export function useProjectTeam(projectId: string) {
  return useQuery({
    queryKey: ["project_team_members", projectId],
    queryFn: async (): Promise<ProjectTeamMember[]> => {
      const { data, error } = await supabase
        .from("project_team_members")
        .select("*, profiles(full_name, email)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as unknown as ProjectTeamMember[];
    },
    enabled: !!projectId,
  });
}

export function useAssignTeamMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, email, role }: { projectId: string; email: string; role: string }) => {
      const { data: profile, error: lookupError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (!profile) throw new Error("No user found with that email — they need an account first.");

      const { error } = await supabase.from("project_team_members").insert({
        project_id: projectId,
        user_id: profile.id,
        role_on_project: role || null,
      });

      if (error) {
        if (error.code === "23505") throw new Error("This person is already on the project team.");
        throw error;
      }
    },
    onSuccess: (_d, variables) => qc.invalidateQueries({ queryKey: ["project_team_members", variables.projectId] }),
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; projectId: string }) => {
      const { error } = await supabase.from("project_team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => qc.invalidateQueries({ queryKey: ["project_team_members", variables.projectId] }),
  });
}
