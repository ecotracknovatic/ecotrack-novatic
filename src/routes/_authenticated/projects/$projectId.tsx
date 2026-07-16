import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PageHeader } from "@/components/page-header";
import { LocationPicker } from "@/components/map/LocationPicker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({ meta: [{ title: "Projects — EcoTrack Novatic" }] }),
  component: Projects,
});

const STATUSES = ["planning", "active", "on_hold", "completed", "archived"] as const;

function Projects() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    organization_id: "",
    name: "",
    description: "",
    target_trees: "",
    location_name: "",
    latitude: null as number | null,
    longitude: null as number | null,
    town: "",
    lga: "",
    state: "",
    country: "",
  });

  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("id, name");

      if (error) throw error;
      return data ?? [];
    },
  });

  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, organizations(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  // Calculate project statistics based on fetched query data
  const projectStats = {
    total: projects.data?.length ?? 0,
    active: projects.data?.filter((p) => p.status === "active").length ?? 0,
    planning: projects.data?.filter((p) => p.status === "planning").length ?? 0,
    completed: projects.data?.filter((p) => p.status === "completed").length ?? 0,
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!form.organization_id) throw new Error("Pick an organization");

      const { error } = await supabase.from("projects").insert({
        organization_id: form.organization_id,
        name: form.name,
        description: form.description || null,
        location_name: form.location_name || null,
        latitude: form.latitude,
        longitude: form.longitude,
        town: form.town || null,
        lga: form.lga || null,
        state: form.state || null,
        country: form.country || null,
        target_trees: form.target_trees ? Number(form.target_trees) : 0,
        created_by: user.id,
      });

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("Project created successfully");
      setOpen(false);
      // Reset form on success
      setForm({
        organization_id: "",
        name: "",
        description: "",
        target_trees: "",
        location_name: "",
        latitude: null,
        longitude: null,
        town: "",
        lga: "",
        state: "",
        country: "",
      });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },

    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Track planning, planting, and verification across all projects."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New project
              </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
                <DialogDescription>
                  Projects belong to an organization. Complete the details and map location below.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  create.mutate();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label>Organization</Label>
                  <Select
                    value={form.organization_id}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        organization_id: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          orgs.data?.length ? "Select organization" : "Create an organization first"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {orgs.data?.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pname">Project name</Label>
                  <Input
                    id="pname"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pdesc">Description</Label>
                  <Textarea
                    id="pdesc"
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Interactive Map Location Picker Section */}
                <div className="space-y-4 pt-2 border-t">
                  <div className="space-y-1.5">
                    <Label htmlFor="loc">Location Display Name / Address</Label>
                    <Input
                      id="loc"
                      placeholder="Will auto-populate from map, or type a custom name..."
                      value={form.location_name}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          location_name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Interact with Map / Target Geolocation</Label>
                    <LocationPicker
                      value={{
                        latitude: form.latitude ?? 9.082, // Centered in Nigeria by default
                        longitude: form.longitude ?? 8.6753,
                      }}
                      onChange={(location) => {
                        setForm((prev) => ({
                          ...prev,
                          latitude: location.latitude,
                          longitude: location.longitude,
                          town: location.town || "",
                          lga: location.lga || "",
                          state: location.state || "",
                          country: location.country || "",
                          location_name: location.formatted || prev.location_name,
                        }));
                      }}
                    />
                  </div>

                  {/* Selected Geocoding Details Panel */}
                  <div className="rounded-lg border p-4 space-y-2 bg-muted/20 text-sm">
                    <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                      Resolved Location Metadata
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <p>
                        <span className="font-semibold text-foreground/80">Town:</span>{" "}
                        {form.town || (
                          <span className="italic text-muted-foreground/50">Not resolved</span>
                        )}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground/80">LGA:</span>{" "}
                        {form.lga || (
                          <span className="italic text-muted-foreground/50">Not resolved</span>
                        )}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground/80">State:</span>{" "}
                        {form.state || (
                          <span className="italic text-muted-foreground/50">Not resolved</span>
                        )}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground/80">Country:</span>{" "}
                        {form.country || (
                          <span className="italic text-muted-foreground/50">Not resolved</span>
                        )}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground/80">Latitude:</span>{" "}
                        {form.latitude !== null ? form.latitude.toFixed(6) : "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground/80">Longitude:</span>{" "}
                        {form.longitude !== null ? form.longitude.toFixed(6) : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t">
                  <Label htmlFor="target">Target Trees</Label>
                  <Input
                    id="target"
                    type="number"
                    min={0}
                    value={form.target_trees}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        target_trees: e.target.value,
                      })
                    }
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? "Creating…" : "Create project"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* KPI Metrics Dashboard Panel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projectStats.total}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{projectStats.active}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Planning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{projectStats.planning}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{projectStats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {projects.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !projects.data?.length ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              No projects yet — create one to begin tracking impact.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data.map((p) => (
            <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }}>
              <Card className="rounded-2xl transition hover:shadow-[var(--shadow-elegant)] animate-in fade-in duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize">
                      {p.status}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {p.description || "No description"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{(p as any).organizations?.name ?? "—"}</span>
                  <span>Target: {p.target_trees ?? 0}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">Statuses: {STATUSES.join(" · ")}</p>
    </div>
  );
}
