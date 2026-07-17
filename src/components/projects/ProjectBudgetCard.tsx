import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectProgress } from "@/hooks/projects/useProjectProgress";

export function ProjectBudgetCard({ projectId }: { projectId: string }) {
  const progress = useProjectProgress(projectId);

  if (progress.isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-muted" />;
  if (progress.error || !progress.data) return <p className="text-sm text-destructive">Couldn't load budget.</p>;

  const { budgetTotal, budgetSpent } = progress.data;
  const total = budgetTotal ?? 0;
  const remaining = total - budgetSpent;
  const utilizationPct = total > 0 ? Math.min(100, Math.round((budgetSpent / total) * 100)) : 0;
  const isOverBudget = total > 0 && budgetSpent > total;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Budget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Allocated</p>
            <p className="text-lg font-semibold">{total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="text-lg font-semibold">{budgetSpent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className={`text-lg font-semibold ${remaining < 0 ? "text-destructive" : ""}`}>
              {remaining.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full ${isOverBudget ? "bg-destructive" : "bg-emerald-600"}`}
            style={{ width: `${utilizationPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{utilizationPct}% utilized</p>
      </CardContent>
    </Card>
  );
}
