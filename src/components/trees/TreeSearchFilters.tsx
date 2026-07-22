import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSpecies } from "@/hooks/useSpecies";
import { useOrganizations } from "@/hooks/useOrganizations";
import { HEALTH_STATUS_OPTIONS } from "@/types/treeDetail";
import type { TreeSearchParams } from "@/hooks/trees/useTreeSearch";

const ALL = "__all__";

interface TreeSearchFiltersProps {
  value: TreeSearchParams;
  onChange: (value: TreeSearchParams) => void;
}

/**
 * No Trees list page exists yet in this repository (confirmed absent in
 * the Tree Details module), so this is built standalone and ready to wire
 * into useTreeSearch once one exists — not integrated into a route here.
 */
export function TreeSearchFilters({ value, onChange }: TreeSearchFiltersProps) {
  const species = useSpecies();
  const organizations = useOrganizations();
  const [gpsRadiusKm, setGpsRadiusKm] = useState("5");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select
          value={value.speciesId ?? ALL}
          onValueChange={(v) => onChange({ ...value, speciesId: v === ALL ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All species</SelectItem>
            {species.data?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.common_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.organizationId ?? ALL}
          onValueChange={(v) => onChange({ ...value, organizationId: v === ALL ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All organizations</SelectItem>
            {organizations.data?.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.healthStatus ?? ALL}
          onValueChange={(v) => onChange({ ...value, healthStatus: v === ALL ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Health" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All health</SelectItem>
            {HEALTH_STATUS_OPTIONS.map((h) => (
              <SelectItem key={h} value={h}>
                {h.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.verificationStatus ?? ALL}
          onValueChange={(v) => onChange({ ...value, verificationStatus: v === ALL ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All verification</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Input placeholder="LGA" value={value.lga ?? ""} onChange={(e) => onChange({ ...value, lga: e.target.value || undefined })} />
        <Input placeholder="State" value={value.state ?? ""} onChange={(e) => onChange({ ...value, state: e.target.value || undefined })} />
        <Input
          placeholder="GPS radius (km)"
          type="number"
          value={gpsRadiusKm}
          onChange={(e) => setGpsRadiusKm(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition((pos) => {
              onChange({
                ...value,
                gpsCenter: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  radiusKm: Number(gpsRadiusKm) || 5,
                },
              });
            });
          }}
        >
          Search near me
        </Button>
      </div>

      {value.gpsCenter && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...value, gpsCenter: undefined })}>
          Clear GPS radius filter
        </Button>
      )}
    </div>
  );
}
