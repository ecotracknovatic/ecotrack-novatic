import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface BulkTreeInsertInput {
  projectid: string;
  organizationId: string;
  speciesId: number;
  speciesCommonName: string;
  quantity: number;
  spacingMeters?: number;
  estimatedAgeYears?: number;
  treeCondition?: "excellent" | "good" | "fair" | "poor" | "diseased" | "dead";
  health?: "healthy" | "at_risk" | "poor" | "dead";
  latitude?: number | null;
  longitude?: number | null;
  notes?: string;
  landUse?: string;
  nurserySource?: string;
}

export function useBulkTreeRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BulkTreeInsertInput) => {
      // 1. Authenticate user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user)
        throw new Error("Unauthorized user. Please sign in to register trees.");

      const { quantity, speciesCommonName, projectId, organizationId, speciesId, ...rest } = input;

      // Clean up common name to create a safe tag code prefix (e.g., "Neem Tree" -> "Neem")
      const cleanSpeciesPrefix = speciesCommonName
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-DR-Z0-9-]/gi, "") // Keep alphanumeric characters and dashes
        .slice(0, 10);

      // 2. Generate the sequential individual record structures
      const bulkRecords = Array.from({ length: quantity }).map((_, index) => {
        const treeNumber = String(index + 1).padStart(3, "0");
        const uniqueTagCode = `${cleanSpeciesPrefix}-${treeNumber}`;

        return {
          project_id: projectId,
          organization_id: organizationId,
          species_id: speciesId,
          tag_code: uniqueTagCode,
          latitude: rest.latitude || null,
          longitude: rest.longitude || null,
          height_cm: null, // Left empty for future physical monitoring audits
          diameter_cm: null,
          health: rest.health || "healthy",
          tree_condition: rest.treeCondition || "good",
          notes: rest.notes || null,
          planted_at: new Date().toISOString(),
          registered_by: user.id,
          verification_status: "pending" as const,
          quantity: 1, // Stored as discrete singular entries for direct historical tracing
          estimated_age_years: rest.estimatedAgeYears || 0,
          land_use: rest.landUse || null,
          nursery_source: rest.nurserySource || null,
        };
      });

      // 3. Batch insert using Supabase single-transaction call
      const { data, error } = await supabase.from("trees").insert(bulkRecords).select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(`Successfully registered ${variables.quantity} individual tree records!`);
    },
    onError: (error: any) => {
      console.error("Bulk registration write failed:", error);
      toast.error(error.message || "Bulk tree registration encountered a database issue.");
    },
  });
}
