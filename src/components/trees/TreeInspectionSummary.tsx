import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTreeMonitoringVisits } from "@/hooks/trees/useTreeMonitoringVisits";

export function TreeInspectionSummary({ treeId }: { treeId: string }) {
  const visits = useTreeMonitoringVisits(treeId);

  if (visits.isLoading) return <div className="h-24 animate-pulse rounded-2xl bg-muted" />;

  const data = visits.data ?? [];
  const lastVisit = data[0]; // already ordered newest-first

  let avgDaysBetween: number | null = null;
  if (data.length >= 2) {
    const sorted = [...data].sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime());
    const totalDays = (new Date(sorted[sorted.length - 1].visit_date).getTime() - new Date(sorted[0].visit_date).getTime()) / 86_400_000;
    avgDaysBetween = Math.round(totalDays / (sorted.length - 1));
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Inspection summary</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Total visits</p>
          <p className="text-lg font-semibold">{data.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Last visit</p>
          <p className="text-lg font-semibold">{lastVisit?.visit_date ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg. cadence</p>
          <p className="text-lg font-semibold">{avgDaysBetween !== null ? `${avgDaysBetween}d` : "—"}</p>
        </div>
        {lastVisit?.recommendations && (
          <p className="col-span-3 mt-1 text-left text-xs text-emerald-700 dark:text-emerald-400">
            Latest recommendation: {lastVisit.recommendations}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
