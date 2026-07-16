import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SpeciesForm } from "@/components/species/SpeciesForm";
import { useCreateSpecies } from "@/hooks/species/useCreateSpecies";
import { emptySpeciesForm, validateSpeciesForm, type SpeciesFormErrors } from "@/lib/speciesSchema";
import type { SpeciesInput } from "@/types/species";

export const Route = createFileRoute("/_authenticated/species/new")({
  head: () => ({ meta: [{ title: "New species — EcoTrack Novatic" }] }),
  component: NewSpecies,
});

function NewSpecies() {
  const navigate = useNavigate();
  const createSpecies = useCreateSpecies();

  const [values, setValues] = useState<SpeciesInput>(emptySpeciesForm);
  const [errors, setErrors] = useState<SpeciesFormErrors>({});

  const handleChange = (patch: Partial<SpeciesInput>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  };

  const handleSubmit = () => {
    const validationErrors = validateSpeciesForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Check the highlighted fields");
      return;
    }

    createSpecies.mutate(values, {
      onSuccess: (species) => {
        toast.success(`${species.common_name} added`);
        void navigate({ to: "/species/$speciesId", params: { speciesId: species.id } });
      },
      onError: (error: Error) => toast.error(error.message),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New species" description="Add a species to the catalog." />
      <div className="mx-auto max-w-2xl">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <SpeciesForm
              values={values}
              errors={errors}
              isEditing={false}
              isSubmitting={createSpecies.isPending}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={() => void navigate({ to: "/species" })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
