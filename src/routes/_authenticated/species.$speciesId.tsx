import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Leaf,
  Loader2,
  Pencil,
  Trash2,
  TreePine,
  Package,
  FolderKanban,
  Droplets,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpeciesForm } from "@/components/species/SpeciesForm";
import { DeleteSpeciesDialog } from "@/components/species/DeleteSpeciesDialog";
import { useSpeciesDetails } from "@/hooks/species/useSpeciesDetails";
import { useUpdateSpecies } from "@/hooks/species/useUpdateSpecies";
import { emptySpeciesForm, validateSpeciesForm, type SpeciesFormErrors } from "@/lib/speciesSchema";
import type { Species, SpeciesInput } from "@/types/species";

export const Route = createFileRoute("/_authenticated/species/$speciesId")({
  head: () => ({ meta: [{ title: "Species — EcoTrack Novatic" }] }),
  component: SpeciesDetail,
});

function toFormValues(species: Species): SpeciesInput {
  return {
    organization_id: species.organization_id ?? "",
    common_name: species.common_name,
    scientific_name: species.scientific_name ?? "",
    family: species.family ?? "",
    species_code: species.species_code ?? "",
    native_status: species.native_status ?? "",
    growth_rate: species.growth_rate ?? "",
    carbon_factor: species.carbon_factor,
    water_requirement: species.water_requirement ?? "",
    soil_type: species.soil_type ?? "",
    description: species.description ?? "",
    image_url: species.image_url ?? "",
    is_active: species.is_active,
  };
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Leaf; label: string; value: string | number }) {
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

function SpeciesDetail() {
  const { speciesId } = Route.useParams();
  const navigate = useNavigate();
  const details = useSpeciesDetails(speciesId);
  const updateSpecies = useUpdateSpecies();

  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [values, setValues] = useState<SpeciesInput>(emptySpeciesForm);
  const [errors, setErrors] = useState<SpeciesFormErrors>({});

  useEffect(() => {
    if (details.data?.species) setValues(toFormValues(details.data.species));
  }, [details.data?.species]);

  if (details.isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading species…
      </div>
    );
  }

  if (details.error || !details.data) {
    return <p className="py-16 text-center text-sm text-destructive">Couldn't load this species.</p>;
  }

  const { species, stats, recentBatches } = details.data;

  const handleChange = (patch: Partial<SpeciesInput>) => setValues((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    const validationErrors = validateSpeciesForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Check the highlighted fields");
      return;
    }

    updateSpecies.mutate(
      { id: species.id, values },
      {
        onSuccess: () => {
          toast.success("Species updated");
          setIsEditing(false);
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <PageHeader title={`Edit ${species.common_name}`} />
        <div className="mx-auto max-w-2xl">
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <SpeciesForm
                values={values}
                errors={errors}
                isEditing
                isSubmitting={updateSpecies.isPending}
                onChange={handleChange}
                onSubmit={handleSave}
                onCancel={() => {
                  setValues(toFormValues(species));
                  setErrors({});
                  setIsEditing(false);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={species.common_name}
        description={species.scientific_name ?? undefined}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" className="gap-2" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="overflow-hidden rounded-2xl">
            <div className="flex h-48 items-center justify-center bg-muted/50">
              {species.image_url ? (
                <img src={species.image_url} alt={species.common_name} className="h-full w-full object-cover" />
              ) : (
                <Leaf className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <CardContent className="space-y-3 pt-4 text-sm">
              <div className="flex flex-wrap gap-1.5">
                {species.species_code && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {species.species_code}
                  </span>
                )}
                <span
                  className={
                    species.is_active
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-950/40 dark:text-green-300"
                      : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  }
                >
                  {species.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <dl className="space-y-1.5">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Family</dt>
                  <dd className="font-medium">{species.family || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Native status</dt>
                  <dd className="font-medium capitalize">{species.native_status || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Growth rate</dt>
                  <dd className="flex items-center gap-1 font-medium capitalize">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {species.growth_rate || "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Water requirement</dt>
                  <dd className="flex items-center gap-1 font-medium capitalize">
                    <Droplets className="h-3.5 w-3.5" />
                    {species.water_requirement || "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Soil type</dt>
                  <dd className="font-medium">{species.soil_type || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Carbon factor</dt>
                  <dd className="font-medium">{species.carbon_factor ?? "Not set"}</dd>
                </div>
              </dl>

              {species.description && (
                <div className="border-t pt-3">
                  <p className="text-muted-foreground">{species.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile icon={TreePine} label="Trees registered" value={stats.treeCount} />
            <StatTile icon={Package} label="Batches" value={stats.batchCount} />
            <StatTile icon={FolderKanban} label="Projects" value={stats.projects.length} />
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Projects using this species</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not used in any project yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {stats.projects.map((p) => (
                    <Link
                      key={p.id}
                      to="/projects/$projectId"
                      params={{ projectId: p.id }}
                      className="rounded-full border px-3 py-1 text-sm hover:bg-accent"
                    >
                      {p.name}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Recent batches</CardTitle>
            </CardHeader>
            <CardContent>
              {recentBatches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No batches registered for this species yet.</p>
              ) : (
                <div className="divide-y">
                  {recentBatches.map((batch) => (
                    <Link
                      key={batch.id}
                      to="/batches/$batchId"
                      params={{ batchId: batch.id }}
                      className="flex items-center justify-between py-2 text-sm hover:text-primary"
                    >
                      <span>{batch.quantity} trees</span>
                      <span className="text-muted-foreground">{batch.planting_date ?? batch.created_at.slice(0, 10)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteSpeciesDialog
        species={species}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => void navigate({ to: "/species" })}
      />
    </div>
  );
}
