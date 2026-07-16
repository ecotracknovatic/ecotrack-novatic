import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BatchContextSection } from "@/components/trees/BatchContextSection";
import { LocationSection } from "@/components/trees/LocationSection";
import { MeasurementsSection } from "@/components/trees/MeasurementsSection";
import { ReviewDialog } from "@/components/trees/ReviewDialog";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useProjectsByOrganization } from "@/hooks/useProjectsByOrganization";
import { usePlantingEvents } from "@/hooks/usePlantingEvents";
import { useSpecies } from "@/hooks/species/useSpecies";
import { useRegisterTreeBatch } from "@/hooks/useRegisterTreeBatch";
import {
  emptyTreeBatchForm,
  validateTreeBatchForm,
  type TreeBatchFormValues,
} from "@/lib/treeBatchSchema";

export function BatchRegistrationForm() {
  const navigate = useNavigate();

  const [values, setValues] = useState<TreeBatchFormValues>(emptyTreeBatchForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<ReturnType<typeof validateTreeBatchForm>>({});
  const [reviewOpen, setReviewOpen] = useState(false);

  const organizations = useOrganizations();
  const projects = useProjectsByOrganization(values.organization_id || null);
  const plantingEvents = usePlantingEvents(values.project_id || null);
  const species = useSpecies();

  const registerBatch = useRegisterTreeBatch();

  const handleChange = (patch: Partial<TreeBatchFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  };

  const handleReviewClick = () => {
    const validationErrors = validateTreeBatchForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Check the highlighted fields before continuing");
      return;
    }

    const selectedSpecies = species.data?.find((s) => s.id === values.species_id);
    if (selectedSpecies && !selectedSpecies.species_code) {
      toast.error(
        "This species has no species code set yet — pick another species or ask an admin to set one",
      );
      return;
    }

    setReviewOpen(true);
  };

  const handleConfirm = () => {
    registerBatch.mutate(
      { values, photo },
      {
        onSuccess: (result) => {
          toast.success(
            `${result.tree_count} trees registered (${result.first_tag_code} – ${result.last_tag_code})`,
          );
          setReviewOpen(false);
          void navigate({ to: "/batches/$batchId", params: { batchId: result.batch.id } });
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const selectedOrganization = organizations.data?.find((o) => o.id === values.organization_id);
  const selectedProject = projects.data?.find((p) => p.id === values.project_id);
  const selectedPlantingEvent = plantingEvents.data?.find((e) => e.id === values.planting_event_id);
  const selectedSpecies = species.data?.find((s) => s.id === values.species_id);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">1. Where & what</CardTitle>
        </CardHeader>
        <CardContent>
          <BatchContextSection values={values} errors={errors} onChange={handleChange} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">2. Location</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationSection
            values={values}
            errors={errors}
            selectedProject={selectedProject}
            onChange={handleChange}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">3. Measurements & status</CardTitle>
        </CardHeader>
        <CardContent>
          <MeasurementsSection
            values={values}
            errors={errors}
            photo={photo}
            onChange={handleChange}
            onPhotoChange={setPhoto}
          />
        </CardContent>
      </Card>

      {registerBatch.isPending && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-900/10 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          Registering {values.quantity} trees — large batches can take a few seconds. This is one
          atomic database operation, so there's no partial/per-row progress to show.
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          size="lg"
          onClick={handleReviewClick}
          disabled={registerBatch.isPending}
        >
          Review batch
        </Button>
      </div>

      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        values={values}
        organization={selectedOrganization}
        project={selectedProject}
        plantingEvent={selectedPlantingEvent}
        species={selectedSpecies}
        photo={photo}
        isSubmitting={registerBatch.isPending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
