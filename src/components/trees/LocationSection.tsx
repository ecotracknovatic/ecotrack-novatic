import { MapPinned } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/map/LocationPicker";
import type { ProjectOption } from "@/hooks/useProjectsByOrganization";
import type { TreeBatchFormValues, TreeBatchFormErrors } from "@/lib/validation/treeBatchSchema";

interface LocationSectionProps {
  values: TreeBatchFormValues;
  errors: TreeBatchFormErrors;
  selectedProject: ProjectOption | undefined;
  onChange: (patch: Partial<TreeBatchFormValues>) => void;
}

export function LocationSection({
  values,
  errors,
  selectedProject,
  onChange,
}: LocationSectionProps) {
  const canInheritFromProject = !!selectedProject?.latitude && !!selectedProject?.longitude;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">GPS location</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          disabled={!canInheritFromProject}
          onClick={() =>
            selectedProject &&
            onChange({
              latitude: selectedProject.latitude,
              longitude: selectedProject.longitude,
              town: selectedProject.town ?? values.town,
              lga: selectedProject.lga ?? values.lga,
              state: selectedProject.state ?? values.state,
              country: selectedProject.country ?? values.country,
            })
          }
        >
          <MapPinned className="h-3.5 w-3.5" />
          Use project location
        </Button>
      </div>

      <LocationPicker
        value={{
          latitude: values.latitude,
          longitude: values.longitude,
          location_name: values.location_name,
          town: values.town,
          lga: values.lga,
          state: values.state,
          country: values.country,
        }}
        onChange={(next) => onChange(next)}
      />

      <p className="text-xs text-muted-foreground">
        Leave unset to inherit the project's (or planting event's) location automatically at
        submission — you only need to set this to override it.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="location_name">Location name</Label>
        <Input
          id="location_name"
          value={values.location_name}
          onChange={(e) => onChange({ location_name: e.target.value })}
          placeholder="e.g. Dutsin-ma community woodlot"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="town">Town</Label>
          <Input
            id="town"
            value={values.town}
            onChange={(e) => onChange({ town: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lga">LGA</Label>
          <Input id="lga" value={values.lga} onChange={(e) => onChange({ lga: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={values.state}
            onChange={(e) => onChange({ state: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={values.country}
            onChange={(e) => onChange({ country: e.target.value })}
          />
        </div>
      </div>

      {errors.latitude && <p className="text-xs text-destructive">{errors.latitude}</p>}
    </div>
  );
}
