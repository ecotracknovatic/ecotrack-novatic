import { ClipboardList, Wrench, Gauge, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTreesOperationsDashboardStats } from "@/hooks/trees/useTreesOperationsDashboardStats";

function StatCard({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: string | number }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-emerald-600" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

/**
 * Not yet wired into the Dashboard route (still unseen) — same pattern as
 * ProjectsDashboardWidgets and PlantingEventsDashboardWidget. Complements
 * TreeStatistics (dead/healthy/needs_attention/verified/pending, already
 * built) with the operations-specific figures that hook doesn't cover.
 */
export function TreeDashboardCards({ organizationId }: { organizationId?: string }) {
  const stats = useTreesOperationsDashboardStats(organizationId);

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
      <StatCard icon={ClipboardList} label="Needing inspection" value={stats.data.needingInspection} />
      <StatCard icon={Wrench} label="Maintenance due" value={stats.data.maintenanceDue} />
      <StatCard
        icon={Gauge}
        label="Avg. AI health score"
        value={stats.data.averageHealthScore !== null ? stats.data.averageHealthScore : "No data yet"}
      />
      <StatCard icon={ClipboardCheck} label="Avg. inspections / tree" value={stats.data.averageInspectionsPerTree} />
    </div>
  );
}
