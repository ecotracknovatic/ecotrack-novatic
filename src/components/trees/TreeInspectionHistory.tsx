import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTreeMonitoringVisits } from "@/hooks/trees/useTreeMonitoringVisits";
import { TreeMonitoringVisitCard } from "@/components/trees/TreeMonitoringVisitCard";

export function TreeInspectionHistory({ treeId }: { treeId: string }) {
  const visits = useTreeMonitoringVisits(treeId);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Inspection history</CardTitle>
      </CardHeader>
      <CardContent>
        {visits.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !visits.data?.length ? (
          <p className="text-sm text-muted-foreground">No monitoring visits recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {visits.data.map((v) => (
              <TreeMonitoringVisitCard key={v.id} visit={v} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
