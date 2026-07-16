import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches the real allowed values for a Postgres enum type via the
 * get_enum_labels() RPC, instead of hardcoding a guessed option list.
 * Cached indefinitely per enum name for the session — enum definitions
 * don't change at runtime.
 */
export function useEnumOptions(enumTypeName: string) {
  return useQuery({
    queryKey: ["enum-options", enumTypeName],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.rpc("get_enum_labels", {
        p_enum_type: enumTypeName,
      });

      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
