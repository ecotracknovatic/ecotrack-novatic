import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Species, SpeciesInput } from "@/types/species";

interface UpdateSpeciesInput {
  id: string;
  values: SpeciesInput;
}

export function useUpdateSpecies() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: UpdateSpeciesInput): Promise<Species> => {
      const { data, error } = await supabase
        .from("tree_species")
        .update({
          organization_id: values.organization_id,
          common_name: values.common_name,
          scientific_name: values.scientific_name || null,
          family: values.family || null,
          species_code: values.species_code || null,
          native_status: values.native_status || null,
          growth_rate: values.growth_rate || null,
          carbon_factor: values.carbon_factor,
          water_requirement: values.water_requirement || null,
          soil_type: values.soil_type || null,
          description: values.description || null,
          image_url: values.image_url || null,
          is_active: values.is_active,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      return data as Species;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["species"] });
      qc.invalidateQueries({ queryKey: ["tree_species"] });
      qc.invalidateQueries({ queryKey: ["species", "detail", variables.id] });
    },
  });
}
