import { Link } from "@tanstack/react-router";
import { Skull, Clock, HeartPulse, ShieldAlert, Recycle, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTreeAlerts, type TreeAlertRef, type TreeAlerts } from "@/hooks/trees/useTreeAlerts";

const SECTIONS: Array<{ key: keyof TreeAlerts; icon: typeof Skull; label: string; tone: string }> = [
  { key: "deadTrees", icon: Skull, label: "Dead trees", tone: "text-red-600" },
  { key: "missingMonitoring", icon: Clock, label: "Missing monitoring", tone: "text-amber-600" },
  { key: "poorHealth", icon: HeartPulse, label: "Poor health", tone: "text-orange-600" },
  { key: "verificationRequired", icon: ShieldAlert, label: "Verification required", tone: "text-blue-600" },
  { key: "replacementRequired", icon: Recycle, label: "Replacement required", tone: "text-purple-600" },
  { key: "slowGrowth", icon: TrendingDown, label: "Slow growth", tone: "text-slate-600" },
];

export function TreeAlertPanel({ organizationId }: { organizationId?: string }) {
  const alerts = useTreeAlerts(organizationId);

  if (alerts.isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (alerts.error || !alerts.data) {
    return <p className="text-sm text-destructive">Couldn't load alerts.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SECTIONS.map(({ key, icon: Icon, label, tone }) => {
        const items = (alerts.data![key] as TreeAlertRef[]) ?? [];
        return (
          <Card key={key} className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${tone}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{items.length}</p>
              {items.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {items.slice(0, 5).map((t) => (
                    <Link
                      key={t.id}
                      to="/trees/$treeId"
                      params={{ treeId: t.id }}
                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] hover:bg-accent"
                    >
                      {t.tag_code}
                    </Link>
                  ))}
                  {items.length > 5 && <span className="text-[10px] text-muted-foreground">+{items.length - 5} more</span>}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
