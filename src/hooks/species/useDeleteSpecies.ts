import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FOREIGN_KEY_VIOLATION = "23503";

export function useDeleteSpecies() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from("tree_species").delete().eq("id", id);

      if (error) {
        if (error.code === FOREIGN_KEY_VIOLATION) {
          throw new Error(
            "This species has trees or batches registered against it and can't be deleted. Deactivate it instead.",
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["species"] });
      qc.invalidateQueries({ queryKey: ["tree_species"] });
    },
  });
}
