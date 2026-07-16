import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — EcoTrack Novatic" }] }),
  component: Notifications,
});

function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Alerts about activity across your projects." />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.length ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Bell className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">You're all caught up.</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.map((n) => (
            <Card key={n.id} className={`rounded-2xl ${n.read ? "" : "border-primary/30"}`}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground">{n.body}</div>}
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}>
                    <Check className="mr-1 h-4 w-4" /> Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
