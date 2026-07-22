import { CloudSun, User } from "lucide-react";
import type { TreeMonitoringVisit } from "@/hooks/trees/useTreeMonitoringVisits";

export function TreeMonitoringVisitCard({ visit, compact = false }: { visit: TreeMonitoringVisit; compact?: boolean }) {
  return (
    <div className={`rounded-lg border ${compact ? "p-2" : "p-3"} text-sm`}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">{visit.visit_date}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          {visit.profiles?.full_name ?? "Unknown inspector"}
        </span>
      </div>

      {visit.weather_notes && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <CloudSun className="h-3 w-3" />
          {visit.weather_notes}
        </p>
      )}

      {!compact && visit.notes && <p className="mt-1 text-muted-foreground">{visit.notes}</p>}
      {!compact && visit.recommendations && (
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">→ {visit.recommendations}</p>
      )}

      {visit.ai_health_score !== null && (
        <p className="mt-1 text-xs text-purple-600">AI health score: {visit.ai_health_score}</p>
      )}
    </div>
  );
}
