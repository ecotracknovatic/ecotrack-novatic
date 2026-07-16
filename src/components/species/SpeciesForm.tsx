import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useOrganizations } from "@/hooks/useOrganizations";
import {
  NATIVE_STATUS_SUGGESTIONS,
  GROWTH_RATE_SUGGESTIONS,
  WATER_REQUIREMENT_SUGGESTIONS,
  type SpeciesInput,
} from "@/types/species";
import type { SpeciesFormErrors } from "@/lib/speciesSchema";

function formatLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

interface SpeciesFormProps {
  values: SpeciesInput;
  errors: SpeciesFormErrors;
  isEditing: boolean;
  isSubmitting: boolean;
  onChange: (patch: Partial<SpeciesInput>) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}

export function SpeciesForm({
  values,
  errors,
  isEditing,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
}: SpeciesFormProps) {
  const organizations = useOrganizations();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-5"
    >
      <div className="space-y-1.5">
        <Label>Organization</Label>
        <Select
          value={values.organization_id}
          onValueChange={(v) => onChange({ organization_id: v })}
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
        {errors.organization_id && <p className="text-xs text-destructive">{errors.organization_id}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="common_name">Common name</Label>
          <Input
            id="common_name"
            value={values.common_name}
            onChange={(e) => onChange({ common_name: e.target.value })}
          />
          {errors.common_name && <p className="text-xs text-destructive">{errors.common_name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scientific_name">Scientific name</Label>
          <Input
            id="scientific_name"
            value={values.scientific_name}
            onChange={(e) => onChange({ scientific_name: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="family">Family</Label>
          <Input id="family" value={values.family} onChange={(e) => onChange({ family: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="species_code">
            Species code <span className="text-muted-foreground">(tree ID prefix)</span>
          </Label>
          <Input
            id="species_code"
            placeholder="e.g. NEEM"
            value={values.species_code}
            onChange={(e) => onChange({ species_code: e.target.value.toUpperCase() })}
          />
          {errors.species_code && <p className="text-xs text-destructive">{errors.species_code}</p>}
          {isEditing && (
            <p className="text-xs text-muted-foreground">
              Changing this won't rename tree IDs already generated with the old code.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Native status</Label>
          <Select value={values.native_status || undefined} onValueChange={(v) => onChange({ native_status: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {NATIVE_STATUS_SUGGESTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {formatLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Growth rate</Label>
          <Select value={values.growth_rate || undefined} onValueChange={(v) => onChange({ growth_rate: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {GROWTH_RATE_SUGGESTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {formatLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Water requirement</Label>
          <Select
            value={values.water_requirement || undefined}
            onValueChange={(v) => onChange({ water_requirement: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {WATER_REQUIREMENT_SUGGESTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {formatLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="carbon_factor">
            Carbon factor <span className="text-muted-foreground">(kg C, optional)</span>
          </Label>
          <Input
            id="carbon_factor"
            type="number"
            min={0}
            step="0.01"
            value={values.carbon_factor ?? ""}
            onChange={(e) =>
              onChange({ carbon_factor: e.target.value.trim() === "" ? null : Number(e.target.value) })
            }
          />
          {errors.carbon_factor && <p className="text-xs text-destructive">{errors.carbon_factor}</p>}
          <p className="text-xs text-muted-foreground">Used by the Phase 3 IPCC carbon engine.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="soil_type">Soil type</Label>
          <Input id="soil_type" value={values.soil_type} onChange={(e) => onChange({ soil_type: e.target.value })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="image_url">Image URL</Label>
        <Input
          id="image_url"
          placeholder="https://…"
          value={values.image_url}
          onChange={(e) => onChange({ image_url: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium text-foreground">Active</p>
          <p className="text-xs text-muted-foreground">
            Inactive species are hidden from Bulk Tree Registration but remain viewable here.
          </p>
        </div>
        <Switch checked={values.is_active} onCheckedChange={(checked) => onChange({ is_active: checked })} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Save changes" : "Create species"}
        </Button>
      </div>
    </form>
  );
}
