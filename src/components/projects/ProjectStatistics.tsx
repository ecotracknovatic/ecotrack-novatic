import { TreePine, Target, HeartPulse, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectProgress } from "@/hooks/projects/useProjectProgress";

function StatCard({ icon: Icon, label, value }: { icon: typeof TreePine; label: string; value: string | number }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-emerald-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function ProjectStatistics({ projectId }: { projectId: string }) {
  const progress = useProjectProgress(projectId);

  if (progress.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[92px] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (progress.error || !progress.data) {
    return <p className="text-sm text-destructive">Couldn't load project statistics.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={TreePine} label="Trees registered" value={progress.data.treeCount} />
      <StatCard
        icon={HeartPulse}
        label="Survival rate"
        value={progress.data.survivalRate !== null ? `${progress.data.survivalRate}%` : "—"}
      />
      <StatCard icon={CheckCircle2} label="Milestones" value={`${progress.data.milestoneCompleted}/${progress.data.milestoneTotal}`} />
      <StatCard icon={Target} label="Completion" value={`${progress.data.completionPercentage}%`} />
    </div>
  );
}
