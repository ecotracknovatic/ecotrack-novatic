import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEnumOptions } from "@/hooks/useEnumOptions";
import type { TreeBatchFormValues, TreeBatchFormErrors } from "@/lib/validation/treeBatchSchema";

// survival_status is a free-text column (not a Postgres enum), so these are
// suggested values rather than schema-enforced options.
const SURVIVAL_STATUS_SUGGESTIONS = ["alive", "dead", "unknown"];

function numberOrNull(raw: string): number | null {
  if (raw.trim() === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

interface MeasurementsSectionProps {
  values: TreeBatchFormValues;
  errors: TreeBatchFormErrors;
  photo: File | null;
  onChange: (patch: Partial<TreeBatchFormValues>) => void;
  onPhotoChange: (file: File | null) => void;
}

export function MeasurementsSection({
  values,
  errors,
  photo,
  onChange,
  onPhotoChange,
}: MeasurementsSectionProps) {
  const conditionOptions = useEnumOptions("tree_condition");
  const healthOptions = useEnumOptions("tree_health");

  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photo) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="dbh">DBH (cm)</Label>
          <Input
            id="dbh"
            type="number"
            min={0}
            step="0.1"
            value={values.dbh ?? ""}
            onChange={(e) => onChange({ dbh: numberOrNull(e.target.value) })}
          />
          {errors.dbh && <p className="text-xs text-destructive">{errors.dbh}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="height">Height (m)</Label>
          <Input
            id="height"
            type="number"
            min={0}
            step="0.1"
            value={values.height ?? ""}
            onChange={(e) => onChange({ height: numberOrNull(e.target.value) })}
          />
          {errors.height && <p className="text-xs text-destructive">{errors.height}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="canopy_width_m">Canopy width (m)</Label>
          <Input
            id="canopy_width_m"
            type="number"
            min={0}
            step="0.1"
            value={values.canopy_width_m ?? ""}
            onChange={(e) => onChange({ canopy_width_m: numberOrNull(e.target.value) })}
          />
          {errors.canopy_width_m && (
            <p className="text-xs text-destructive">{errors.canopy_width_m}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="nursery_source">Nursery source</Label>
          <Input
            id="nursery_source"
            value={values.nursery_source}
            onChange={(e) => onChange({ nursery_source: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ownership">Ownership</Label>
          <Input
            id="ownership"
            value={values.ownership}
            onChange={(e) => onChange({ ownership: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="land_use">Land use</Label>
          <Input
            id="land_use"
            value={values.land_use}
            onChange={(e) => onChange({ land_use: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maintenance_frequency">Maintenance frequency</Label>
          <Input
            id="maintenance_frequency"
            placeholder="e.g. Weekly, Monthly"
            value={values.maintenance_frequency}
            onChange={(e) => onChange({ maintenance_frequency: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Tree condition</Label>
          <Select
            value={values.tree_condition}
            onValueChange={(v) => onChange({ tree_condition: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder={conditionOptions.isLoading ? "Loading…" : "Select"} />
            </SelectTrigger>
            <SelectContent>
              {conditionOptions.data?.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tree_condition && (
            <p className="text-xs text-destructive">{errors.tree_condition}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Tree health</Label>
          <Select value={values.health} onValueChange={(v) => onChange({ health: v })}>
            <SelectTrigger>
              <SelectValue placeholder={healthOptions.isLoading ? "Loading…" : "Select"} />
            </SelectTrigger>
            <SelectContent>
              {healthOptions.data?.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.health && <p className="text-xs text-destructive">{errors.health}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Survival status</Label>
          <Select
            value={values.survival_status}
            onValueChange={(v) => onChange({ survival_status: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {SURVIVAL_STATUS_SUGGESTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.survival_status && (
            <p className="text-xs text-destructive">{errors.survival_status}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Reference photo</Label>
        <p className="text-xs text-muted-foreground">
          One shared reference photo for this batch. Individual tree photos come later, in Photo
          Verification.
        </p>
        {photo ? (
          <div className="flex items-center gap-3 rounded-lg border p-2">
            {photoPreviewUrl && (
              <img
                src={photoPreviewUrl}
                alt="Selected batch reference"
                className="h-16 w-16 rounded-md object-cover"
              />
            )}
            <div className="flex-1 truncate text-sm text-foreground">{photo.name}</div>
            <Button type="button" variant="ghost" size="icon" onClick={() => onPhotoChange(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground hover:bg-accent">
            <ImagePlus className="h-4 w-4" />
            Choose a photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>
    </div>
  );
}
