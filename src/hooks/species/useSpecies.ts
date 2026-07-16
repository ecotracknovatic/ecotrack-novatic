import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Species } from "@/types/species";

export interface SpeciesListParams {
  search?: string;
  nativeStatus?: string | null;
  growthRate?: string | null;
  isActive?: boolean | null;
  organizationId?: string | null;
  page?: number;
  pageSize?: number;
}

export interface SpeciesListResult {
  items: Species[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

const DEFAULT_PAGE_SIZE = 12;

/**
 * Escapes PostgREST / SQL wildcard characters (% and _)
 */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[%_]/g, "\\$&");
}

export function useSpecies(params: SpeciesListParams = {}) {
  const {
    search = "",
    nativeStatus = null,
    growthRate = null,
    isActive = null,
    organizationId = null,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = params;

  const cleanedSearch = search.trim();

  return useQuery({
    queryKey: [
      "species",
      "list",
      { search: cleanedSearch, nativeStatus, growthRate, isActive, organizationId, page, pageSize },
    ],
    queryFn: async (): Promise<SpeciesListResult> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("tree_species")
        .select("*", { count: "exact" })
        .order("common_name", { ascending: true })
        .range(from, to);

      if (cleanedSearch) {
        const sanitized = sanitizeSearchTerm(cleanedSearch);
        // Matches common_name OR scientific_name via trigram indexes
        query = query.or(`common_name.ilike.%${sanitized}%,scientific_name.ilike.%${sanitized}%`);
      }

      if (nativeStatus) query = query.eq("native_status", nativeStatus);
      if (growthRate) query = query.eq("growth_rate", growthRate);
      if (isActive !== null) query = query.eq("is_active", isActive);

      // Support org-scoped species filtering
      if (organizationId) {
        query = query.or(`organization_id.is.null,organization_id.eq.${organizationId}`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const totalCount = count ?? 0;
      const calculatedPageCount = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);

      return {
        items: (data ?? []) as unknown as Species[],
        totalCount,
        page,
        pageSize,
        pageCount: calculatedPageCount,
      };
    },
  });
}