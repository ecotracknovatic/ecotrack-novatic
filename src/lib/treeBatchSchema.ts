import { z } from "zod";

export const treeBatchSchema = z.object({
  organization_id: z.string().uuid({ message: "Select an organization" }),
  project_id: z.string().uuid({ message: "Select a project" }),
  planting_event_id: z.string().uuid().nullable(),
  species_id: z.string().uuid({ message: "Select a species" }),
  quantity: z
    .number({ invalid_type_error: "Enter a quantity" })
    .int("Quantity must be a whole number")
    .min(1, "At least 1 tree")
    .max(5000, "Maximum 5,000 trees per batch"),
  planting_date: z.string().min(1, "Select a planting date"),

  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  location_name: z.string(),
  town: z.string(),
  lga: z.string(),
  state: z.string(),
  country: z.string(),

  dbh: z.number().positive("Must be greater than 0").nullable(),
  height: z.number().positive("Must be greater than 0").nullable(),
  canopy_width_m: z.number().positive("Must be greater than 0").nullable(),

  nursery_source: z.string(),
  ownership: z.string(),
  land_use: z.string(),
  maintenance_frequency: z.string(),

  tree_condition: z.string().min(1, "Select a condition"),
  health: z.string().min(1, "Select a health status"),
  survival_status: z.string().min(1, "Select a survival status"),

  notes: z.string(),
});

export type TreeBatchFormValues = z.infer<typeof treeBatchSchema>;

export const emptyTreeBatchForm: TreeBatchFormValues = {
  organization_id: "",
  project_id: "",
  planting_event_id: null,
  species_id: "",
  quantity: 1,
  planting_date: new Date().toISOString().slice(0, 10),

  latitude: null,
  longitude: null,
  location_name: "",
  town: "",
  lga: "",
  state: "",
  country: "",

  dbh: null,
  height: null,
  canopy_width_m: null,

  nursery_source: "",
  ownership: "",
  land_use: "",
  maintenance_frequency: "",

  tree_condition: "",
  health: "",
  survival_status: "",

  notes: "",
};

export type TreeBatchFormErrors = Partial<Record<keyof TreeBatchFormValues, string>>;

export function validateTreeBatchForm(values: TreeBatchFormValues): TreeBatchFormErrors {
  const result = treeBatchSchema.safeParse(values);
  if (result.success) return {};

  const errors: TreeBatchFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof TreeBatchFormValues | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
