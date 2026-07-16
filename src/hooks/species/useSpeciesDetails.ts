import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Species } from "@/types/species";

export interface SpeciesUsageStats {
  treeCount: number;
  batchCount: number;
  projects: Array<{ id: string; name: string }>;
}

export interface SpeciesBatchSummary {
  id: string; // UUID
  quantity: number;
  planting_date: string | null;
  created_at: string;
}

export interface SpeciesDetails {
  species: Species;
  stats: SpeciesUsageStats;
  recentBatches: SpeciesBatchSummary[];
}

interface UsageRpcResponse {
  tree_count: number;
  batch_count: number;
  projects: Array<{ id: string; name: string }>;
}

export function useSpeciesDetails(speciesId: number) {
  return useQuery({
    queryKey: ["species", "detail", speciesId],
    queryFn: async (): Promise<SpeciesDetails> => {
      // Execute all 3 requests concurrently
      const [speciesRes, usageRes, batchesRes] = await Promise.all([
        supabase
          .from("tree_species")
          .select("*")
          .eq("id", speciesId)
          .single(),
        supabase.rpc("get_species_usage", { p_species_id: speciesId }),
        supabase
          .from("tree_batches")
          .select("id, quantity, planting_date, created_at")
          .eq("species_id", speciesId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (speciesRes.error) throw speciesRes.error;
      if (!speciesRes.data) throw new Error(`Species with ID ${speciesId} not found.`);

      if (usageRes.error) throw usageRes.error;
      if (batchesRes.error) throw batchesRes.error;

      const usage = usageRes.data as unknown as UsageRpcResponse | null;

      return {
        species: speciesRes.data as unknown as Species,
        stats: {
          treeCount: usage?.tree_count ?? 0,
          batchCount: usage?.batch_count ?? 0,
          projects: usage?.projects ?? [],
        },
        recentBatches: (batchesRes.data ?? []) as SpeciesBatchSummary[],
      };
    },
    enabled: speciesId != null && !isNaN(speciesId) && speciesId > 0,
  });
}