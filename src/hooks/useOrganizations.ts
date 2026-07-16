import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrganizationOption {
  id: string;
  name: string;
}

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async (): Promise<OrganizationOption[]> => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}
