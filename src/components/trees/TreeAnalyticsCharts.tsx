import { useTreeAnalytics } from "@/hooks/trees/useTreeAnalytics";
import { useTreesOperationsDashboardStats } from "@/hooks/trees/useTreesOperationsDashboardStats";
import { TreeAnalyticsCard } from "@/components/trees/TreeAnalyticsCard";
import { TreeHealthDistribution } from "@/components/trees/TreeHealthDistribution";
import { TreeGrowthAnalytics } from "@/components/trees/TreeGrowthAnalytics";

export function TreeAnalyticsCharts({ organizationId }: { organizationId?: string }) {
  const analytics = useTreeAnalytics(organizationId);
  const opsStats = useTreesOperationsDashboardStats(organizationId);

  return (
    <div className="space-y-6">
      <TreeGrowthAnalytics organizationId={organizationId} />

      <div className="grid gap-6 sm:grid-cols-2">
        <TreeAnalyticsCard
          title="Survival trend"
          data={analytics.data?.survivalTrend ?? []}
          dataKey="survival_rate"
          seriesLabel="Survival rate (%)"
          color="#2563eb"
          isLoading={analytics.isLoading}
        />
        <TreeHealthDistribution distribution={opsStats.data?.healthDistribution ?? {}} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TreeAnalyticsCard
          title="Maintenance trend"
          data={analytics.data?.maintenanceTrend ?? []}
          dataKey="record_count"
          seriesLabel="Maintenance records"
          color="#d97706"
          isLoading={analytics.isLoading}
        />
        <TreeAnalyticsCard
          title="Inspection trend"
          data={analytics.data?.inspectionTrend ?? []}
          dataKey="visit_count"
          seriesLabel="Monitoring visits"
          color="#7c3aed"
          isLoading={analytics.isLoading}
        />
      </div>
    </div>
  );
}
