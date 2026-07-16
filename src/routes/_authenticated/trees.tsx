import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, TreePine, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/trees")({
  head: () => ({ meta: [{ title: "Tree Tracking — EcoTrack Novatic" }] }),
  component: TreesPage,
});

function TreesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    project_id: "",
    species_id: "",
    tag_code: "",
    latitude: "",
    longitude: "",
    health: "healthy",
    notes: "",
  });

  const projects = useQuery({
    queryKey: ["projects-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name, organization_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const species = useQuery({
    queryKey: ["species"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tree_species").select("id, common_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const trees = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trees")
        .select("*, projects(name), tree_species(common_name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const proj = projects.data?.find((p) => p.id === form.project_id);
      if (!proj) throw new Error("Pick a project");
      const { error } = await supabase.from("trees").insert({
        project_id: proj.id,
        organization_id: proj.organization_id,
        species_id: form.species_id || null,
        tag_code: form.tag_code || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        health: form.health as never,
        notes: form.notes || null,
        registered_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tree registered");
      setOpen(false);
      setForm({
        project_id: "",
        species_id: "",
        tag_code: "",
        latitude: "",
        longitude: "",
        health: "healthy",
        notes: "",
      });
      qc.invalidateQueries({ queryKey: ["trees"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not available");
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setForm((f) => ({
          ...f,
          latitude: p.coords.latitude.toFixed(6),
          longitude: p.coords.longitude.toFixed(6),
        })),
      () => toast.error("Could not get location"),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tree tracking"
        description="Register and monitor individual trees with GPS, species, and health."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Register tree
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register a new tree</DialogTitle>
                <DialogDescription>Add details to start monitoring this tree.</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  create.mutate();
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Project</Label>
                    <Select
                      value={form.project_id}
                      onValueChange={(v) => setForm({ ...form, project_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.data?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Species</Label>
                    <Select
                      value={form.species_id}
                      onValueChange={(v) => setForm({ ...form, species_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select species" />
                      </SelectTrigger>
                      <SelectContent>
                        {species.data?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.common_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tag">Tag / code</Label>
                    <Input
                      id="tag"
                      value={form.tag_code}
                      onChange={(e) => setForm({ ...form, tag_code: e.target.value })}
                      placeholder="T-001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Health</Label>
                    <Select
                      value={form.health}
                      onValueChange={(v) => setForm({ ...form, health: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["healthy", "at_risk", "poor", "dead"].map((h) => (
                          <SelectItem key={h} value={h} className="capitalize">
                            {h.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useMyLocation}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" /> Use my location
                </Button>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? "Saving…" : "Register tree"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {trees.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !trees.data?.length ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <TreePine className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              No trees yet — register one to start tracking.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Tag</th>
                    <th className="px-4 py-3">Species</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Health</th>
                    <th className="px-4 py-3">Verification</th>
                    <th className="px-4 py-3">GPS</th>
                  </tr>
                </thead>
                <tbody>
                  {trees.data.map((t: any) => (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{t.tag_code || t.id.slice(0, 6)}</td>
                      <td className="px-4 py-3">{t.tree_species?.common_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.projects?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize">
                          {t.health}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                          {t.verification_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {t.latitude
                          ? `${Number(t.latitude).toFixed(3)}, ${Number(t.longitude).toFixed(3)}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
