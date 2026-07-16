import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { NATIVE_STATUS_SUGGESTIONS, GROWTH_RATE_SUGGESTIONS } from "@/types/species";

const ALL = "__all__";

function formatLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export interface SpeciesFiltersValue {
  nativeStatus: string | null;
  growthRate: string | null;
  isActive: boolean | null;
}

interface SpeciesFiltersProps {
  value: SpeciesFiltersValue;
  onChange: (value: SpeciesFiltersValue) => void;
}

export function SpeciesFilters({ value, onChange }: SpeciesFiltersProps) {
  const hasActiveFilters = value.nativeStatus || value.growthRate || value.isActive !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={value.nativeStatus ?? ALL}
        onValueChange={(v) => onChange({ ...value, nativeStatus: v === ALL ? null : v })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Native status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All native status</SelectItem>
          {NATIVE_STATUS_SUGGESTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {formatLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.growthRate ?? ALL}
        onValueChange={(v) => onChange({ ...value, growthRate: v === ALL ? null : v })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Growth rate" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All growth rates</SelectItem>
          {GROWTH_RATE_SUGGESTIONS.map((rate) => (
            <SelectItem key={rate} value={rate}>
              {formatLabel(rate)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.isActive === null ? ALL : value.isActive ? "active" : "inactive"}
        onValueChange={(v) =>
          onChange({ ...value, isActive: v === ALL ? null : v === "active" })
        }
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => onChange({ nativeStatus: null, growthRate: null, isActive: null })}
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
