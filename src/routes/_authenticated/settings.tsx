import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — EcoTrack Novatic" }] }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "", bio: "" });
  const [saving, setSaving] = useState(false);

  const profile = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile.data) {
      setForm({
        full_name: profile.data.full_name ?? "",
        phone: profile.data.phone ?? "",
        bio: profile.data.bio ?? "",
      });
    }
  }, [profile.data]);

  const roles = useQuery({
    queryKey: ["my-roles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: form.full_name, phone: form.phone, bio: form.bio })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile, preferences and account." />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This information may be visible to your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fn">Full name</Label>
              <Input
                id="fn"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ph">Phone</Label>
              <Input
                id="ph"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Your roles</CardTitle>
          <CardDescription>Platform-level access roles assigned to you.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          {roles.data?.length ? (
            roles.data.map((r) => (
              <span key={r.role} className="rounded-full bg-accent px-3 py-1 text-xs capitalize">
                {r.role.replace("_", " ")}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground">No roles assigned.</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
