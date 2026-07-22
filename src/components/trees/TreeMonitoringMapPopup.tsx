import { useTreeMonitoringVisits } from "@/hooks/trees/useTreeMonitoringVisits";

const HEALTH_STYLES: Record<string, string> = {
  Healthy: "bg-green-100 text-green-700",
  healthy: "bg-green-100 text-green-700",
  "Needs Attention": "bg-amber-100 text-amber-700",
  needs_attention: "bg-amber-100 text-amber-700",
  Diseased: "bg-orange-100 text-orange-700",
  diseased: "bg-orange-100 text-orange-700",
  Dead: "bg-red-100 text-red-700",
  dead: "bg-red-100 text-red-700",
};

export function TreeMonitoringMapPopup({ treeId, tagCode, healthStatus }: { treeId: string; tagCode: string; healthStatus: string | null }) {
  const visits = useTreeMonitoringVisits(treeId);
  const recentVisits = (visits.data ?? []).slice(0, 3);

  return (
    <div className="min-w-[180px] text-sm">
      <p className="font-medium">{tagCode}</p>
      {healthStatus && (
        <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] capitalize ${HEALTH_STYLES[healthStatus] ?? "bg-muted"}`}>
          {healthStatus}
        </span>
      )}

      {!visits.isLoading && recentVisits.length > 0 && (
        <ul className="mt-2 space-y-1 border-t pt-1 text-xs text-muted-foreground">
          {recentVisits.map((v) => (
            <li key={v.id}>{v.visit_date} — {v.profiles?.full_name ?? "inspector"}</li>
          ))}
        </ul>
      )}

      <a href={`/trees/${treeId}`} className="mt-2 block text-xs text-primary underline">
        View tree
      </a>
    </div>
  );
}
