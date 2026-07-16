import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/verification")({
  head: () => ({ meta: [{ title: "Verification — EcoTrack Novatic" }] }),
  component: Verification,
});

function Verification() {
  const qc = useQueryClient();
  const pending = useQuery({
    queryKey: ["pending-trees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trees")
        .select("id, tag_code, health, latitude, longitude, projects(name)")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("trees")
        .update({ verification_status: status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["pending-trees"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification"
        description="Review pending tree records and approve or reject them."
      />
      {pending.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !pending.data?.length ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Nothing pending. All caught up!</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {pending.data.map((t: any) => (
            <Card key={t.id} className="rounded-2xl">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">{t.tag_code || `Tree ${t.id.slice(0, 6)}`}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.projects?.name} · <span className="capitalize">{t.health}</span>
                    {t.latitude
                      ? ` · ${Number(t.latitude).toFixed(3)}, ${Number(t.longitude).toFixed(3)}`
                      : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => decide.mutate({ id: t.id, status: "rejected" })}
                  >
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                  <Button size="sm" onClick={() => decide.mutate({ id: t.id, status: "approved" })}>
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
