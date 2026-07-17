import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { ProjectBudgetEntry, ProjectFundingSource } from "@/types/project";

function invalidateBudget(qc: ReturnType<typeof useQueryClient>, projectId: string) {
  qc.invalidateQueries({ queryKey: ["project_budget_entries", projectId] });
  qc.invalidateQueries({ queryKey: ["project_funding_sources", projectId] });
  qc.invalidateQueries({ queryKey: ["project_progress", projectId] });
}

export function useProjectBudgetEntries(projectId: string) {
  return useQuery({
    queryKey: ["project_budget_entries", projectId],
    queryFn: async (): Promise<ProjectBudgetEntry[]> => {
      const { data, error } = await supabase
        .from("project_budget_entries")
        .select("*")
        .eq("project_id", projectId)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useProjectFundingSources(projectId: string) {
  return useQuery({
    queryKey: ["project_funding_sources", projectId],
    queryFn: async (): Promise<ProjectFundingSource[]> => {
      const { data, error } = await supabase
        .from("project_funding_sources")
        .select("*")
        .eq("project_id", projectId)
        .order("received_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useCreateBudgetEntry() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      category: string;
      description: string;
      amount: number;
      entry_type: "expense" | "income";
      entry_date: string;
    }) => {
      const { error } = await supabase.from("project_budget_entries").insert({
        ...input,
        description: input.description || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, variables) => invalidateBudget(qc, variables.project_id),
  });
}

export function useCreateFundingSource() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      source_name: string;
      amount: number;
      received_date: string;
      notes: string;
    }) => {
      const { error } = await supabase.from("project_funding_sources").insert({
        ...input,
        received_date: input.received_date || null,
        notes: input.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, variables) => invalidateBudget(qc, variables.project_id),
  });
}
