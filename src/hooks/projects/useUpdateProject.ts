import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectFormValues } from "@/lib/validation/projectSchema";

export function useUpdateProject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ProjectFormValues }) => {
      const { data, error } = await supabase
        .from("projects")
        .update({
          organization_id: values.organization_id,
          name: values.name,
          description: values.description || null,
          status: values.status,
          location_name: values.location_name || null,
          latitude: values.latitude,
          longitude: values.longitude,
          town: values.town || null,
          lga: values.lga || null,
          state: values.state || null,
          country: values.country || null,
          target_trees: values.target_trees ?? 0,
          start_date: values.start_date || null,
          end_date: values.end_date || null,
          budget_total: values.budget_total,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project_progress", variables.id] });
    },
  });
}
