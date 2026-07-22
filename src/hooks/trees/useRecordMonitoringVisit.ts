import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { uploadTreePhotoFile } from "@/hooks/trees/useTreePhotos";

export interface RecordVisitInput {
  tree_id: string;
  visit_date: string;
  latitude: number | null;
  longitude: number | null;
  weather_notes: string;
  notes: string;
  recommendations: string;
  health_status: string | null;
  health_notes: string;
  disease_symptoms: string;
  recommended_actions: string;
  height_cm: number | null;
  diameter_cm: number | null;
  canopy_width_m: number | null;
  stem_diameter_cm: number | null;
  age_years: number | null;
  photos: File[];
}

export function useRecordMonitoringVisit() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: RecordVisitInput) => {
      const { data, error } = await supabase.rpc("record_monitoring_visit", {
        p_tree_id: input.tree_id,
        p_visit_date: input.visit_date,
        p_latitude: input.latitude,
        p_longitude: input.longitude,
        p_weather_notes: input.weather_notes || null,
        p_notes: input.notes || null,
        p_recommendations: input.recommendations || null,
        p_health_status: input.health_status,
        p_health_notes: input.health_notes || null,
        p_disease_symptoms: input.disease_symptoms || null,
        p_recommended_actions: input.recommended_actions || null,
        p_height_cm: input.height_cm,
        p_diameter_cm: input.diameter_cm,
        p_canopy_width_m: input.canopy_width_m,
        p_stem_diameter_cm: input.stem_diameter_cm,
        p_age_years: input.age_years,
      });
      if (error) throw error;

      const result = data as { visit_id: string; health_id: string | null; measurement_id: string | null };

      for (const file of input.photos) {
        await uploadTreePhotoFile({
          treeId: input.tree_id,
          file,
          caption: "",
          photoType: "monthly_monitoring",
          visitId: result.visit_id,
          uploadedBy: user?.id,
        });
      }

      return result;
    },
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: ["tree_monitoring_visits", variables.tree_id] });
      qc.invalidateQueries({ queryKey: ["tree_health_records", variables.tree_id] });
      qc.invalidateQueries({ queryKey: ["tree_measurements", variables.tree_id] });
      qc.invalidateQueries({ queryKey: ["tree_photos", variables.tree_id] });
      qc.invalidateQueries({ queryKey: ["tree_details", variables.tree_id] });
    },
  });
}
