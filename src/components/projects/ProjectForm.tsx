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
import { Loader2 } from "lucide-react";
import { useOrganizations } from "@/hooks/useOrganizations";
import { LocationPicker } from "@/components/map/LocationPicker";
import type { ProjectFormValues, ProjectFormErrors } from "@/lib/validation/projectSchema";

// Matches the real project_status values confirmed in the existing
// projects.tsx STATUSES constant, plus the newly added "draft".
const STATUS_OPTIONS = ["draft", "planning", "active", "on_hold", "completed", "archived"];

function numberOrNull(raw: string): number | null {
  if (raw.trim() === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

interface ProjectFormProps {
  values: ProjectFormValues;
  errors: ProjectFormErrors;
  isEditing: boolean;
  isSubmitting: boolean;
  onChange: (patch: Partial<ProjectFormValues>) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}

export function ProjectForm({ values, errors, isEditing, isSubmitting, onChange, onSubmit, onCancel }: ProjectFormProps) {
  const organizations = useOrganizations();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <Label>Organization</Label>
        <Select value={values.organization_id} onValueChange={(v) => onChange({ organization_id: v })}>
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

      <div className="space-y-1.5">
        <Label htmlFor="name">Project name</Label>
        <Input id="name" value={values.name} onChange={(e) => onChange({ name: e.target.value })} />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={values.status} onValueChange={(v) => onChange({ status: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
      </div>

      <div className="space-y-4 border-t pt-4">
        <div className="space-y-1.5">
          <Label htmlFor="location_name">Location name</Label>
          <Input
            id="location_name"
            placeholder="e.g. Dutsin-ma, Katsina"
            value={values.location_name}
            onChange={(e) => onChange({ location_name: e.target.value })}
          />
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
      </div>

      <div className="grid grid-cols-2 gap-3 border-t pt-4">
        <div className="space-y-1.5">
          <Label htmlFor="target_trees">Target trees</Label>
          <Input
            id="target_trees"
            type="number"
            min={0}
            value={values.target_trees ?? ""}
            onChange={(e) => onChange({ target_trees: numberOrNull(e.target.value) })}
          />
          {errors.target_trees && <p className="text-xs text-destructive">{errors.target_trees}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="budget_total">Budget</Label>
          <Input
            id="budget_total"
            type="number"
            min={0}
            step="0.01"
            value={values.budget_total ?? ""}
            onChange={(e) => onChange({ budget_total: numberOrNull(e.target.value) })}
          />
          {errors.budget_total && <p className="text-xs text-destructive">{errors.budget_total}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start date</Label>
          <Input
            id="start_date"
            type="date"
            value={values.start_date}
            onChange={(e) => onChange({ start_date: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">End date</Label>
          <Input
            id="end_date"
            type="date"
            value={values.end_date}
            onChange={(e) => onChange({ end_date: e.target.value })}
          />
          {errors.end_date && <p className="text-xs text-destructive">{errors.end_date}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
