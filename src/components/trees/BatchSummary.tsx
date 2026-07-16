import type { OrganizationOption } from "@/hooks/useOrganizations";
import type { ProjectOption } from "@/hooks/useProjectsByOrganization";
import type { PlantingEventOption } from "@/hooks/usePlantingEvents";
import type { TreeSpeciesOption } from "@/hooks/species/useSpecies";
import type { TreeBatchFormValues } from "@/lib/validation/treeBatchSchema";

interface BatchSummaryProps {
  values: TreeBatchFormValues;
  organization: OrganizationOption | undefined;
  project: ProjectOption | undefined;
  plantingEvent: PlantingEventOption | undefined;
  species: TreeSpeciesOption | undefined;
  photo: File | null;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value || "—"}</span>
    </div>
  );
}

export function BatchSummary({
  values,
  organization,
  project,
  plantingEvent,
  species,
  photo,
}: BatchSummaryProps) {
  const previewPrefix = species?.species_code ?? "?";

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-lg border border-emerald-900/10 bg-emerald-50 p-3 dark:bg-emerald-950/20">
        <p className="font-medium text-emerald-900 dark:text-emerald-200">
          {values.quantity} {species?.common_name ?? "tree"}
          {values.quantity === 1 ? "" : "s"} will be registered
        </p>
        <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
          Tree codes like {previewPrefix}-000001 through {previewPrefix}-
          {String(values.quantity).padStart(6, "0")} — the exact starting number is assigned
          atomically by the database at submission, not shown here in advance.
        </p>
      </div>

      <div className="divide-y rounded-lg border px-3">
        <SummaryRow label="Organization" value={organization?.name ?? ""} />
        <SummaryRow label="Project" value={project?.name ?? ""} />
        <SummaryRow label="Planting event" value={plantingEvent?.title ?? "None"} />
        <SummaryRow label="Species" value={species?.common_name ?? ""} />
        <SummaryRow label="Quantity" value={String(values.quantity)} />
        <SummaryRow label="Planting date" value={values.planting_date} />
      </div>

      <div className="divide-y rounded-lg border px-3">
        <SummaryRow
          label="Location"
          value={
            values.latitude && values.longitude
              ? `${values.latitude.toFixed(5)}, ${values.longitude.toFixed(5)}`
              : "Inherited from project"
          }
        />
        <SummaryRow label="Location name" value={values.location_name} />
        <SummaryRow label="Town" value={values.town} />
        <SummaryRow label="LGA" value={values.lga} />
        <SummaryRow label="State" value={values.state} />
        <SummaryRow label="Country" value={values.country} />
      </div>

      <div className="divide-y rounded-lg border px-3">
        <SummaryRow label="DBH" value={values.dbh ? `${values.dbh} cm` : ""} />
        <SummaryRow label="Height" value={values.height ? `${values.height} m` : ""} />
        <SummaryRow
          label="Canopy width"
          value={values.canopy_width_m ? `${values.canopy_width_m} m` : ""}
        />
        <SummaryRow label="Nursery source" value={values.nursery_source} />
        <SummaryRow label="Ownership" value={values.ownership} />
        <SummaryRow label="Land use" value={values.land_use} />
        <SummaryRow label="Maintenance frequency" value={values.maintenance_frequency} />
        <SummaryRow label="Condition" value={values.tree_condition} />
        <SummaryRow label="Health" value={values.health} />
        <SummaryRow label="Survival status" value={values.survival_status} />
        <SummaryRow label="Photo" value={photo ? photo.name : "None attached"} />
      </div>

      {values.notes && (
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
          <p className="text-foreground">{values.notes}</p>
        </div>
      )}
    </div>
  );
}
