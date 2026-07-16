import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
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
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/organizations")({
  head: () => ({ meta: [{ title: "Organizations — EcoTrack Novatic" }] }),
  component: Organizations,
});

function Organizations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    city: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("organizations").insert({
        name: form.name,
        description: form.description || null,
        website: form.website || null,
        email: form.email || null,
        phone: form.phone || null,
        country: form.country || null,
        state: form.state || null,
        city: form.city || null,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Organization created");
      setOpen(false);
      setForm({
        name: "",
        description: "",
        website: "",
        email: "",
        phone: "",
        country: "",
        state: "",
        city: "",
      });
      qc.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="Workspaces that group your projects, members and tree data."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create organization</DialogTitle>
                <DialogDescription>You'll be added as the owner automatically.</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  create.mutate();
                }}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? "Creating…" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.length ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              No organizations yet. Create your first one to get started.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((o) => (
            <Link key={o.id} to="/organizations/$orgId" params={{ orgId: o.id }}>
              <Card className="rounded-2xl transition hover:shadow-[var(--shadow-elegant)]">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                    {o.logo_url ? (
                      <img src={o.logo_url} alt={o.name} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
                  </div>
                  <CardTitle className="text-base">{o.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {o.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {[o.city, o.country].filter(Boolean).join(", ") || "—"} ·{" "}
                  {new Date(o.created_at).toLocaleDateString()}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
