import { useTreeAnalytics } from "@/hooks/trees/useTreeAnalytics";
import { TreeAnalyticsCard } from "@/components/trees/TreeAnalyticsCard";
import { TreeGrowthSummary } from "@/components/trees/TreeGrowthSummary";

export function TreeGrowthAnalytics({ organizationId }: { organizationId?: string }) {
  const analytics = useTreeAnalytics(organizationId);

  return (
    <div className="space-y-6">
      <TreeAnalyticsCard
        title="Growth trend (avg. height)"
        data={analytics.data?.growthTrend ?? []}
        dataKey="avg_height_cm"
        seriesLabel="Avg height (cm)"
        color="#16a34a"
        isLoading={analytics.isLoading}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TreeGrowthSummary title="Species performance" rows={analytics.data?.speciesPerformance ?? []} labelKey="species_name" />
        <TreeGrowthSummary title="Project performance" rows={analytics.data?.projectPerformance ?? []} labelKey="project_name" />
      </div>
    </div>
  );
}
