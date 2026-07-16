import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteSpecies } from "@/hooks/species/useDeleteSpecies";
import { useUpdateSpecies } from "@/hooks/species/useUpdateSpecies";
import type { Species } from "@/types/species";
import { toast } from "sonner";

interface DeleteSpeciesDialogProps {
  species: Species;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteSpeciesDialog({ species, open, onOpenChange, onDeleted }: DeleteSpeciesDialogProps) {
  const deleteSpecies = useDeleteSpecies();
  const updateSpecies = useUpdateSpecies();
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const handleDelete = () => {
    setBlockedMessage(null);
    deleteSpecies.mutate(species.id, {
      onSuccess: () => {
        toast.success(`${species.common_name} deleted`);
        onOpenChange(false);
        onDeleted?.();
      },
      onError: (error: Error) => {
        setBlockedMessage(error.message);
      },
    });
  };

  const handleDeactivateInstead = () => {
    updateSpecies.mutate(
      {
        id: species.id,
        values: {
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
          is_active: false,
        },
      },
      {
        onSuccess: () => {
          toast.success(`${species.common_name} deactivated`);
          onOpenChange(false);
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  const isBusy = deleteSpecies.isPending || updateSpecies.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Delete {species.common_name}?</DialogTitle>
          <DialogDescription>This permanently removes the species record. This can't be undone.</DialogDescription>
        </DialogHeader>

        {blockedMessage && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{blockedMessage}</span>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2 sm:justify-between">
          {blockedMessage ? (
            <Button type="button" onClick={handleDeactivateInstead} disabled={isBusy} className="gap-2">
              {updateSpecies.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Deactivate instead
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isBusy} className="gap-2">
              {deleteSpecies.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete permanently
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
