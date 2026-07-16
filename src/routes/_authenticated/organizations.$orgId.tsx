import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  FolderKanban,
  Mail,
  MapPin,
  Phone,
  Plus,
  TreePine,
  Upload,
  UserMinus,
  Users,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/page-header";
import type { Database } from "@/integrations/supabase/types";

type OrgRole = Database["public"]["Enums"]["org_member_role"];
const ORG_ROLES: OrgRole[] = ["owner", "admin", "manager", "officer", "member"];
const ASSIGNABLE_ROLES: OrgRole[] = ["admin", "manager", "officer", "member"];

export const Route = createFileRoute("/_authenticated/organizations/$orgId")({
  head: () => ({ meta: [{ title: "Organization — EcoTrack Novatic" }] }),
  component: OrgDetail,
});

function OrgDetail() {
  const { orgId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const org = useQuery({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const members = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_org_members", { _org: orgId });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invitations = useQuery({
    queryKey: ["org-invitations", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_invitations")
        .select("*")
        .eq("organization_id", orgId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const projects = useQuery({
    queryKey: ["org-projects", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, target_trees, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const treeCount = useQuery({
    queryKey: ["org-tree-count", orgId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("trees")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const recentTrees = useQuery({
    queryKey: ["org-recent-trees", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trees")
        .select("id, species_id, planted_at, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const myMembership = useMemo(
    () => members.data?.find((m) => m.user_id === user?.id),
    [members.data, user?.id],
  );
  const isAdmin = myMembership?.role === "owner" || myMembership?.role === "admin";

  if (org.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!org.data)
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost">
          <Link to="/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>
        <p>Organization not found.</p>
      </div>
    );

  const o = org.data;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/organizations">
          <ArrowLeft className="mr-2 h-4 w-4" /> All organizations
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="h-16 w-16 rounded-2xl">
          <AvatarImage src={o.logo_url ?? undefined} alt={o.name} className="object-cover" />
          <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-7 w-7" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{o.name}</h1>
          <p className="text-sm text-muted-foreground">{o.description || "No description"}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={FolderKanban} label="Projects" value={projects.data?.length ?? 0} />
            <StatCard icon={Users} label="Members" value={members.data?.length ?? 0} />
            <StatCard icon={TreePine} label="Trees" value={treeCount.data ?? 0} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoLine icon={Mail} value={o.email} />
                <InfoLine icon={Phone} value={o.phone} />
                <InfoLine icon={Globe} value={o.website} href={o.website ?? undefined} />
                <InfoLine
                  icon={MapPin}
                  value={[o.city, o.state, o.country].filter(Boolean).join(", ") || null}
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Recent activity</CardTitle>
                <CardDescription>Latest trees added to this organization</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTrees.data?.length ? (
                  <ul className="divide-y divide-border text-sm">
                    {recentTrees.data.map((t) => (
                      <li key={t.id} className="flex items-center justify-between py-2">
                        <span className="flex items-center gap-2">
                          <TreePine className="h-4 w-4 text-primary" />
                          Tree registered
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <MembersPanel
            orgId={orgId}
            isAdmin={isAdmin}
            currentUserId={user?.id}
            members={members.data ?? []}
            invitations={invitations.data ?? []}
            onChanged={() => {
              qc.invalidateQueries({ queryKey: ["org-members", orgId] });
              qc.invalidateQueries({ queryKey: ["org-invitations", orgId] });
            }}
          />
        </TabsContent>

        <TabsContent value="projects">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.data?.length ? (
                <ul className="divide-y divide-border text-sm">
                  {projects.data.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2">
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: p.id }}
                        className="font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                      <Badge variant="secondary" className="capitalize">
                        {p.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <SettingsPanel
              org={o}
              onSaved={() => qc.invalidateQueries({ queryKey: ["organization", orgId] })}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{value}</CardContent>
    </Card>
  );
}

function InfoLine({
  icon: Icon,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | null;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      {value ? (
        href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-foreground hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="text-foreground">{value}</span>
        )
      ) : (
        <span>—</span>
      )}
    </div>
  );
}

type MemberRow = Database["public"]["Functions"]["get_org_members"]["Returns"][number];
type Invitation = Database["public"]["Tables"]["organization_invitations"]["Row"];

function MembersPanel({
  orgId,
  isAdmin,
  currentUserId,
  members,
  invitations,
  onChanged,
}: {
  orgId: string;
  isAdmin: boolean;
  currentUserId?: string;
  members: MemberRow[];
  invitations: Invitation[];
  onChanged: () => void;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");

  const invite = useMutation({
    mutationFn: async () => {
      const parsed = z.string().trim().email().max(255).parse(email);
      const { data, error } = await supabase.rpc("invite_org_member", {
        _org: orgId,
        _email: parsed,
        _role: role,
      });
      if (error) throw error;
      return data as { added?: boolean; invited?: boolean };
    },
    onSuccess: (r) => {
      toast.success(r?.added ? "Member added" : "Invitation sent");
      setInviteOpen(false);
      setEmail("");
      setRole("member");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: OrgRole }) => {
      const { error } = await supabase.rpc("update_org_member_role", {
        _org: orgId,
        _user: userId,
        _role: newRole,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("remove_org_member", { _org: orgId, _user: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("organization_invitations")
        .update({ status: "revoked" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invitation revoked");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team"
        description={`${members.length} member${members.length === 1 ? "" : "s"}`}
        actions={
          isAdmin ? (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Invite member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a member</DialogTitle>
                  <DialogDescription>
                    If the email is already registered, they'll be added immediately. Otherwise an
                    invitation is created.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    invite.mutate();
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      required
                      maxLength={255}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
                      <SelectTrigger id="invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="capitalize">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={invite.isPending}>
                      {invite.isPending ? "Sending…" : "Send invitation"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li
                key={m.member_id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={m.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {(m.full_name ?? m.email ?? "U").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {m.full_name ?? "Unnamed user"}
                      {m.user_id === currentUserId && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{m.email ?? "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && m.role !== "owner" ? (
                    <Select
                      value={m.role}
                      onValueChange={(v) =>
                        changeRole.mutate({ userId: m.user_id, newRole: v as OrgRole })
                      }
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="capitalize">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary" className="capitalize">
                      {m.role}
                    </Badge>
                  )}
                  {isAdmin && m.role !== "owner" && m.user_id !== currentUserId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" aria-label="Remove member">
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove member?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will revoke their access to the organization. They can be
                            re-invited later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeMember.mutate(m.user_id)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isAdmin && invitations.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Pending invitations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {invitations.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{inv.email}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {inv.role} · invited {new Date(inv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => revokeInvite.mutate(inv.id)}>
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type OrgRow = Database["public"]["Tables"]["organizations"]["Row"];

const orgSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  website: z.string().trim().max(255).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
});

function SettingsPanel({ org, onSaved }: { org: OrgRow; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: org.name,
    description: org.description ?? "",
    email: org.email ?? "",
    phone: org.phone ?? "",
    website: org.website ?? "",
    country: org.country ?? "",
    state: org.state ?? "",
    city: org.city ?? "",
  });
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = orgSchema.parse(form);
      const { error } = await supabase
        .from("organizations")
        .update({
          name: parsed.name,
          description: parsed.description || null,
          email: parsed.email || null,
          phone: parsed.phone || null,
          website: parsed.website || null,
          country: parsed.country || null,
          state: parsed.state || null,
          city: parsed.city || null,
        })
        .eq("id", org.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Organization updated");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleLogo(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${org.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("org-logos")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("org-logos")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signErr) throw signErr;
      const { error: updErr } = await supabase
        .from("organizations")
        .update({ logo_url: signed.signedUrl })
        .eq("id", org.id);
      if (updErr) throw updErr;
      toast.success("Logo updated");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
          <CardDescription>PNG, JPG, or SVG up to 5MB.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-2xl">
            <AvatarImage src={org.logo_url ?? undefined} className="object-cover" />
            <AvatarFallback className="rounded-2xl">
              <Building2 className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleLogo(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload logo"}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Field label="Name" className="sm:col-span-2">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Website" className="sm:col-span-2">
              <Input
                value={form.website}
                placeholder="https://"
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </Field>
            <Field label="Country">
              <Input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </Field>
            <Field label="State">
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </Field>
            <Field label="City" className="sm:col-span-2">
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
// suppress unused-warning for enum constants
void ORG_ROLES;
