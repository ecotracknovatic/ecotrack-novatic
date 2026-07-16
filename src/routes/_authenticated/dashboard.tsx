import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  FolderKanban,
  ShieldCheck,
  TreePine,
  Leaf,
  ArrowUpRight,
  Sprout,
  PlusCircle,
  FileSpreadsheet,
  CalendarPlus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types"; // Adjust this import path based on your project structure
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

// Define strong types for the recent trees join query
type TreeRow = Database["public"]["Tables"]["trees"]["Row"];
type SpeciesRow = Database["public"]["Tables"]["tree_species"]["Row"];

interface RecentActivityTree extends Pick<
  TreeRow,
  "id" | "tag_code" | "created_at" | "health" | "verification_status" | "survival_status"
> {
  tree_species: Pick<SpeciesRow, "common_name"> | null;
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EcoTrack Novatic" }] }),
  component: Dashboard,
});

// Helper function for ultra-lightweight relative time formatting without external dependencies
function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Parallelized data fetching
      const [orgs, projects, trees, verified, alive, species, carbonData] = await Promise.all([
        supabase.from("organizations").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("trees").select("id", { count: "exact", head: true }),
        supabase
          .from("trees")
          .select("id", { count: "exact", head: true })
          .eq("verification_status", "approved"),
        supabase
          .from("trees")
          .select("id", { count: "exact", head: true })
          .eq("survival_status", "alive"),
        supabase.from("tree_species").select("id", { count: "exact", head: true }),
        // Performance guard: Only fetching carbon for approved/verified trees to prevent spoofing
        supabase.from("trees").select("carbon_co2e").eq("verification_status", "approved"),
      ]);

      // Fail-fast error propagation
      if (orgs.error) throw orgs.error;
      if (projects.error) throw projects.error;
      if (trees.error) throw trees.error;
      if (verified.error) throw verified.error;
      if (alive.error) throw alive.error;
      if (species.error) throw species.error;
      if (carbonData.error) throw carbonData.error;

      const totalTrees = trees.count ?? 0;
      const aliveTrees = alive.count ?? 0;

      // Calculate scientifically accurate survival rate based on dedicated status
      const survivalRate = totalTrees > 0 ? Math.round((aliveTrees / totalTrees) * 100) : 0;

      // Safe accumulation of accurate carbon metrics
      const totalCarbon =
        carbonData.data?.reduce((sum, t) => sum + (Number(t.carbon_co2e) || 0), 0) ?? 0;

      return {
        organizations: orgs.count ?? 0,
        projects: projects.count ?? 0,
        trees: totalTrees,
        verified: verified.count ?? 0,
        survivalRate,
        species: species.count ?? 0,
        carbon: totalCarbon,
      };
    },
  });

  // V1 color layout mapping to help users scan metrics instantly
  const stats = [
    {
      label: "Active Organizations",
      value: data?.organizations,
      icon: Building2,
      colorClass: "text-purple-500 bg-purple-500/10",
    },
    {
      label: "Total Projects",
      value: data?.projects,
      icon: FolderKanban,
      colorClass: "text-amber-500 bg-amber-500/10",
    },
    {
      label: "Trees Registered",
      value: data?.trees,
      icon: TreePine,
      colorClass: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: "Trees Verified",
      value: data?.verified,
      icon: ShieldCheck,
      colorClass: "text-blue-500 bg-blue-500/10",
    },
    {
      label: "Species Cataloged",
      value: data?.species,
      icon: Leaf,
      colorClass: "text-teal-500 bg-teal-500/10",
    },
    {
      label: "Survival Rate",
      value: data?.survivalRate,
      suffix: "%",
      icon: Sprout,
      colorClass: "text-indigo-500 bg-indigo-500/10",
    },
  ];

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p className="font-semibold">Failed to load dashboard data.</p>
        <p className="text-xs opacity-80">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your environmental impact and project activity."
      />

      {/* Grid Layout for visual stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-2xl transition-all hover:shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-xs font-medium">{s.label}</CardDescription>
              <div className={`p-1.5 rounded-lg ${s.colorClass}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${s.value?.toLocaleString()}${s.suffix ?? ""}`
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Verified-Only Carbon sequestered block */}
        <Card
          className="rounded-2xl lg:col-span-2"
          style={{ background: "var(--gradient-primary)" }}
        >
          <CardHeader>
            <div className="flex items-center gap-2 text-primary-foreground">
              <Leaf className="h-5 w-5" />
              <CardTitle className="text-primary-foreground">Carbon impact</CardTitle>
            </div>
            <CardDescription className="text-primary-foreground/80">
              Verified CO₂ sequestered across approved tree inventories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold tracking-tight text-primary-foreground">
              {isLoading ? (
                <Skeleton className="h-10 w-48 bg-primary-foreground/20" />
              ) : (
                <>
                  {data?.carbon.toLocaleString()}{" "}
                  <span className="text-base font-normal opacity-80">kg CO₂e / yr</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Action Workflows */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump into a workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { to: "/trees/batch", label: "Register Batch", icon: FileSpreadsheet },
              { to: "/species", label: "Add Species", icon: PlusCircle },
              { to: "/projects", label: "Create Planting Event", icon: CalendarPlus },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <a.icon className="h-4 w-4 text-primary" />
                  {a.label}
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest events across your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentActivity />
        </CardContent>
      </Card>
    </div>
  );
}

function RecentActivity() {
  const { data, isLoading } = useQuery<RecentActivityTree[]>({
    queryKey: ["recent-trees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trees")
        .select(
          `
          id, 
          tag_code, 
          created_at, 
          health, 
          verification_status,
          survival_status,
          species_id,
          tree_species ( common_name )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;

      // Type assertions for joined relational schema
      return (data as unknown as RecentActivityTree[]) ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No activity yet — register your first tree to get started.
      </div>
    );
  }

  // Format activity details contextually using robust scientific indicators
  const getActivityDetails = (tree: RecentActivityTree) => {
    const label = tree.tag_code || (tree.tree_species?.common_name ?? "Unknown Tree");

    if (tree.survival_status === "dead") {
      return {
        icon: XCircle,
        iconColor: "text-rose-500",
        message: "Marked Dead",
        tag: label,
      };
    }
    if (tree.verification_status === "approved") {
      return {
        icon: CheckCircle2,
        iconColor: "text-emerald-500",
        message: "Verified",
        tag: label,
      };
    }
    return {
      icon: TreePine,
      iconColor: "text-primary",
      message: `Registered (${tree.health || "Good"})`,
      tag: label,
    };
  };

  return (
    <ul className="divide-y divide-border">
      {data.map((t) => {
        const details = getActivityDetails(t);
        const IconComponent = details.icon;
        return (
          <li key={t.id} className="flex items-center justify-between py-3 text-sm">
            <div className="flex items-center gap-3">
              <IconComponent className={`h-4 w-4 ${details.iconColor}`} />
              <span className="font-semibold text-foreground">{details.tag}</span>
              <span className="text-muted-foreground">{details.message}</span>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatRelativeTime(t.created_at)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
