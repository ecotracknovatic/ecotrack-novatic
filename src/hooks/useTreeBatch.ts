import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TreeBatchRecord {
  id: number;
  project_id: string;
  organization_id: string;
  planting_event_id: string | null;
  species_id: number;
  quantity: number;
  planting_date: string | null;
  location_name: string | null;
  town: string | null;
  latitude: number | null;
  longitude: number | null;
  dbh: number | null;
  height: number | null;
  canopy_width_m: number | null;
  tree_condition: string | null;
  ownership: string | null;
  land_use: string | null;
  nursery_source: string | null;
  maintenance_frequency: string | null;
  survival_status: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  projects: { name: string } | null;
  tree_species: { common_name: string; species_code: string | null } | null;
}

export function useTreeBatch(batchId: string) {
  return useQuery({
    queryKey: ["tree_batches", batchId],
    queryFn: async (): Promise<TreeBatchRecord> => {
      const { data, error } = await supabase
        .from("tree_batches")
        .select("*, projects(name), tree_species(common_name, species_code)")
        .eq("id", batchId)
        .single();

      if (error) throw error;
      return data as unknown as TreeBatchRecord;
    },
  });
}

export interface BatchTreePreviewRow {
  id: string;
  tag_code: string;
  verification_status: string;
  health: string;
}

const PREVIEW_LIMIT = 25;

// Only fetches a small preview page + a cheap exact count — never pulls all
// rows for a batch that could contain up to 5,000 trees.
export function useBatchTreesPreview(batchId: string) {
  return useQuery({
    queryKey: ["trees", "batch-preview", batchId],
    queryFn: async (): Promise<{ rows: BatchTreePreviewRow[]; totalCount: number }> => {
      const { data, error, count } = await supabase
        .from("trees")
        .select("id, tag_code, verification_status, health", { count: "exact" })
        .eq("batch_id", batchId)
        .order("tag_code", { ascending: true })
        .limit(PREVIEW_LIMIT);

      if (error) throw error;
      return { rows: (data ?? []) as unknown as BatchTreePreviewRow[], totalCount: count ?? 0 };
    },
  });
}
