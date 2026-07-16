import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Species, SpeciesInput } from "@/types/species";

export function useCreateSpecies() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SpeciesInput): Promise<Species> => {
      const { data, error } = await supabase
        .from("tree_species")
        .insert({
          organization_id: input.organization_id,
          common_name: input.common_name,
          scientific_name: input.scientific_name || null,
          family: input.family || null,
          species_code: input.species_code || null,
          native_status: input.native_status || null,
          growth_rate: input.growth_rate || null,
          carbon_factor: input.carbon_factor,
          water_requirement: input.water_requirement || null,
          soil_type: input.soil_type || null,
          description: input.description || null,
          image_url: input.image_url || null,
          is_active: input.is_active,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data as Species;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["species"] });
      qc.invalidateQueries({ queryKey: ["tree_species"] });
    },
  });
}
