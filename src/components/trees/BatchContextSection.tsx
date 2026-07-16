import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useProjectsByOrganization } from "@/hooks/useProjectsByOrganization";
import { usePlantingEvents } from "@/hooks/usePlantingEvents";
import { useSpecies } from "@/hooks/species/useSpecies";
import type { TreeBatchFormValues, TreeBatchFormErrors } from "@/lib/validation/treeBatchSchema";

const NO_PLANTING_EVENT = "__none__";

interface BatchContextSectionProps {
  values: TreeBatchFormValues;
  errors: TreeBatchFormErrors;
  onChange: (patch: Partial<TreeBatchFormValues>) => void;
}

export function BatchContextSection({ values, errors, onChange }: BatchContextSectionProps) {
  const organizations = useOrganizations();
  const projects = useProjectsByOrganization(values.organization_id || null);
  const plantingEvents = usePlantingEvents(values.project_id || null);
  const species = useSpecies();

  const selectedSpecies = species.data?.find((s) => s.id === values.species_id);
  const speciesMissingCode = !!selectedSpecies && !selectedSpecies.species_code;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Organization</Label>
        <Select
          value={values.organization_id}
          onValueChange={(v) =>
            onChange({ organization_id: v, project_id: "", planting_event_id: null })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.data?.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.organization_id && (
          <p className="text-xs text-destructive">{errors.organization_id}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Project</Label>
        <Select
          value={values.project_id}
          onValueChange={(v) => onChange({ project_id: v, planting_event_id: null })}
          disabled={!values.organization_id}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={values.organization_id ? "Select project" : "Pick an organization first"}
            />
          </SelectTrigger>
          <SelectContent>
            {projects.data?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.project_id && <p className="text-xs text-destructive">{errors.project_id}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Planting event</Label>
        <Select
          value={values.planting_event_id ?? NO_PLANTING_EVENT}
          onValueChange={(v) => onChange({ planting_event_id: v === NO_PLANTING_EVENT ? null : v })}
          disabled={!values.project_id}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select planting event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PLANTING_EVENT}>No planting event</SelectItem>
            {plantingEvents.data?.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.title}
                {e.planting_date ? ` — ${e.planting_date}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Optional — location and date are still inherited from the project if left unset.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Species</Label>
        <Select value={values.species_id} onValueChange={(v) => onChange({ species_id: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select species" />
          </SelectTrigger>
          <SelectContent>
            {species.data?.map((s) => (
              <SelectItem key={s.id} value={s.id} disabled={!s.species_code}>
                {s.common_name}
                {s.scientific_name ? ` (${s.scientific_name})` : ""}
                {!s.species_code ? " — no species code set" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.species_id && <p className="text-xs text-destructive">{errors.species_id}</p>}
        {speciesMissingCode && (
          <p className="text-xs text-destructive">
            This species has no species code set — it can't be used for registration until an admin
            sets one.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            max={5000}
            value={values.quantity}
            onChange={(e) => onChange({ quantity: Number(e.target.value) })}
          />
          {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="planting_date">Planting date</Label>
          <Input
            id="planting_date"
            type="date"
            value={values.planting_date}
            onChange={(e) => onChange({ planting_date: e.target.value })}
          />
          {errors.planting_date && (
            <p className="text-xs text-destructive">{errors.planting_date}</p>
          )}
        </div>
      </div>
    </div>
  );
}
