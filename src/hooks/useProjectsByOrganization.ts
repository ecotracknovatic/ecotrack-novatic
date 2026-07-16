import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectOption {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  town: string | null;
  lga: string | null;
  state: string | null;
  country: string | null;
}

export function useProjectsByOrganization(organizationId: string | null) {
  return useQuery({
    queryKey: ["projects", "by-organization", organizationId],
    queryFn: async (): Promise<ProjectOption[]> => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, latitude, longitude, town, lga, state, country")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });
}
