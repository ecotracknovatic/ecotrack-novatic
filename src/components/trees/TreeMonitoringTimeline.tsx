import { ClipboardCheck } from "lucide-react";
import { useTreeMonitoringVisits } from "@/hooks/trees/useTreeMonitoringVisits";

export function TreeMonitoringTimeline({ treeId }: { treeId: string }) {
  const visits = useTreeMonitoringVisits(treeId);

  if (visits.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!visits.data?.length) return <p className="text-sm text-muted-foreground">No visits yet.</p>;

  // useTreeMonitoringVisits already orders by visit_date desc; reverse for a
  // chronological (oldest-first) timeline read.
  const chronological = [...visits.data].reverse();

  return (
    <ol className="space-y-3">
      {chronological.map((v) => (
        <li key={v.id} className="flex gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-emerald-600">
            <ClipboardCheck className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Visit — {v.profiles?.full_name ?? "Unknown inspector"}
            </p>
            <p className="text-xs text-muted-foreground">{v.visit_date}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
