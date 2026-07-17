import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { ProjectFormValues } from "@/lib/validation/projectSchema";

export function useCreateProject() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      if (!user) throw new Error("Not signed in");

      const { data, error } = await supabase
        .from("projects")
        .insert({
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
          created_by: user.id,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    // Same query key ["projects"] already used by the existing list query —
    // no new/duplicate key introduced.
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
