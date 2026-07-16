import { useQuery } from "@tanstack/react-query";
import { Leaf, CheckCircle2, XCircle, Sprout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface SpeciesGlobalStats {
  total: number;
  active: number;
  inactive: number;
  native: number;
}

function useSpeciesGlobalStats() {
  return useQuery({
    queryKey: ["species", "stats"],
    queryFn: async (): Promise<SpeciesGlobalStats> => {
      const [totalRes, activeRes, nativeRes] = await Promise.all([
        supabase.from("tree_species").select("id", { count: "exact", head: true }),
        supabase.from("tree_species").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("tree_species").select("id", { count: "exact", head: true }).eq("native_status", "native"),
      ]);

      if (totalRes.error) throw totalRes.error;
      if (activeRes.error) throw activeRes.error;
      if (nativeRes.error) throw nativeRes.error;

      const total = totalRes.count ?? 0;
      const active = activeRes.count ?? 0;

      return {
        total,
        active,
        inactive: total - active,
        native: nativeRes.count ?? 0,
      };
    },
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Leaf;
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${tone}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function SpeciesStats() {
  const stats = useSpeciesGlobalStats();

  if (stats.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (stats.error || !stats.data) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Leaf} label="Total species" value={stats.data.total} tone="text-emerald-600" />
      <StatCard icon={CheckCircle2} label="Active" value={stats.data.active} tone="text-green-600" />
      <StatCard icon={XCircle} label="Inactive" value={stats.data.inactive} tone="text-muted-foreground" />
      <StatCard icon={Sprout} label="Native species" value={stats.data.native} tone="text-emerald-700" />
    </div>
  );
}
