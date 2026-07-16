import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadBatchPhoto } from "@/lib/storage";
import type { TreeBatchFormValues } from "@/lib/validation/treeBatchSchema";

export interface RegisterTreeBatchResult {
  batch: {
    id: string;
    project_id: string;
    species_id: number;
    quantity: number;
    [key: string]: unknown;
  };
  tree_count: number;
  first_tag_code: string;
  last_tag_code: string;
}

interface RegisterTreeBatchInput {
  values: TreeBatchFormValues;
  photo: File | null;
}

export function useRegisterTreeBatch() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      values,
      photo,
    }: RegisterTreeBatchInput): Promise<RegisterTreeBatchResult> => {
      let photoUrl: string | null = null;
      if (photo) {
        photoUrl = await uploadBatchPhoto(photo, values.organization_id);
      }

      const { data, error } = await supabase.rpc("register_tree_batch", {
        p_project_id: values.project_id,
        p_organization_id: values.organization_id,
        p_species_id: values.species_id,
        p_quantity: values.quantity,
        p_planting_event_id: values.planting_event_id,
        p_planting_date: values.planting_date,
        p_estimated_age: null,
        p_estimated_age_years: null,
        p_latitude: values.latitude,
        p_longitude: values.longitude,
        p_dbh: values.dbh,
        p_height: values.height,
        p_canopy_width_m: values.canopy_width_m,
        p_health_status: null,
        p_tree_condition: values.tree_condition,
        p_ownership: values.ownership || null,
        p_land_use: values.land_use || null,
        p_backdated: false,
        p_nursery_source: values.nursery_source || null,
        p_maintenance_frequency: values.maintenance_frequency || null,
        p_survival_status: values.survival_status,
        p_photo_url: photoUrl,
        p_planting_method: null,
        p_caretaker_name: null,
        p_notes: values.notes || null,
        p_town: values.town || null,
        p_lga: values.lga || null,
        p_state: values.state || null,
        p_country: values.country || null,
        p_location_name: values.location_name || null,
        p_health: values.health,
      });

      if (error) throw error;
      return data as RegisterTreeBatchResult;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["trees"] });
      qc.invalidateQueries({ queryKey: ["tree_batches"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tree_species"] });
      void result;
    },
  });
}
