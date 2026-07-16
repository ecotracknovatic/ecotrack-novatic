import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { BatchSummary } from "@/components/trees/BatchSummary";
import type { OrganizationOption } from "@/hooks/useOrganizations";
import type { ProjectOption } from "@/hooks/useProjectsByOrganization";
import type { PlantingEventOption } from "@/hooks/usePlantingEvents";
import type { TreeSpeciesOption } from "@/hooks/species/useSpecies";
import type { TreeBatchFormValues } from "@/lib/validation/treeBatchSchema";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: TreeBatchFormValues;
  organization: OrganizationOption | undefined;
  project: ProjectOption | undefined;
  plantingEvent: PlantingEventOption | undefined;
  species: TreeSpeciesOption | undefined;
  photo: File | null;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function ReviewDialog({
  open,
  onOpenChange,
  values,
  organization,
  project,
  plantingEvent,
  species,
  photo,
  isSubmitting,
  onConfirm,
}: ReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Review batch before saving</DialogTitle>
          <DialogDescription>
            Every tree in this batch is created in one atomic operation — check the details below
            before confirming.
          </DialogDescription>
        </DialogHeader>

        <BatchSummary
          values={values}
          organization={organization}
          project={project}
          plantingEvent={plantingEvent}
          species={species}
          photo={photo}
        />

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Back to edit
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isSubmitting} className="gap-2">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Registering trees…" : `Confirm & register ${values.quantity} trees`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
