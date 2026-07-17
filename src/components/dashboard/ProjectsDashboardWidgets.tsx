import { Link } from "@tanstack/react-router";
import { FolderKanban, Sprout, TreePine, HeartPulse, Wallet, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectsDashboardStats } from "@/hooks/projects/useProjectsDashboardStats";

function StatCard({ icon: Icon, label, value }: { icon: typeof FolderKanban; label: string; value: string | number }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-emerald-600" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

/**
 * Not yet wired into the Dashboard route — that file wasn't available to
 * edit precisely. Drop <ProjectsDashboardWidgets /> into the dashboard's
 * widget grid to surface it, same pattern as PlantingEventsDashboardWidget.
 */
export function ProjectsDashboardWidgets() {
  const stats = useProjectsDashboardStats();

  if (stats.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (stats.error || !stats.data) return null;

  const utilizationPct =
    stats.data.budgetTotal > 0 ? Math.round((stats.data.budgetSpent / stats.data.budgetTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label="Active projects" value={stats.data.activeProjects} />
        <StatCard icon={Sprout} label="Trees planned" value={stats.data.treesPlanned} />
        <StatCard icon={TreePine} label="Trees planted" value={stats.data.treesPlanted} />
        <StatCard icon={HeartPulse} label="Survival rate" value={stats.data.survivalRate !== null ? `${stats.data.survivalRate}%` : "—"} />
        <StatCard icon={Wallet} label="Budget utilization" value={`${utilizationPct}%`} />
        <StatCard icon={CalendarClock} label="Upcoming milestones" value={stats.data.upcomingMilestones} />
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Recent activities</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.data.recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="divide-y">
              {stats.data.recentActivities.map((a) => (
                <Link
                  key={a.id}
                  to="/projects/$projectId"
                  params={{ projectId: a.project_id }}
                  className="flex items-center justify-between py-2 text-sm hover:text-primary"
                >
                  <span>{a.title}</span>
                  <span className="text-xs text-muted-foreground">{a.activity_date}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
