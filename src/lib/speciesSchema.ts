import { z } from "zod";
import type { SpeciesInput } from "./species"; // Adjust path if needed (e.g. "@/types/species")

export const speciesSchema = z.object({
  organization_id: z
    .string()
    .uuid({ message: "Select an organization" })
    .nullable()
    .optional()
    .or(z.literal("")),
  common_name: z.string().min(1, "Common name is required"),
  scientific_name: z.string().nullable().optional(),
  family: z.string().nullable().optional(),
  species_code: z
    .string()
    .min(1, "Species code is required — it's the prefix used for tree IDs (e.g. NEEM)")
    .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only, no spaces")
    .transform((val) => val.toUpperCase()),
  native_status: z.string().nullable().optional(),
  growth_rate: z.string().nullable().optional(),
  carbon_factor: z.number().min(0, "Must be 0 or greater").nullable().optional(),
  water_requirement: z.string().nullable().optional(),
  soil_type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  image_path: z.string().nullable().optional(),
  is_active: z.boolean().default(true),

  // Extended botanical & AI engine fields
  leaf_type: z.string().nullable().optional(),
  canopy_diameter: z.number().min(0, "Must be 0 or greater").nullable().optional(),
  average_height: z.number().min(0, "Must be 0 or greater").nullable().optional(),
  lifespan: z.number().int().min(0, "Must be 0 or greater").nullable().optional(),
  flowering_season: z.string().nullable().optional(),
  fruiting_season: z.string().nullable().optional(),
  root_system: z.string().nullable().optional(),
});

export type SpeciesFormErrors = Partial<Record<keyof SpeciesInput, string>>;

export function validateSpeciesForm(values: SpeciesInput): SpeciesFormErrors {
  const result = speciesSchema.safeParse(values);
  if (result.success) return {};

  const errors: SpeciesFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof SpeciesInput | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

export const emptySpeciesForm: SpeciesInput = {
  organization_id: "",
  common_name: "",
  scientific_name: "",
  family: "",
  species_code: "",
  native_status: "",
  growth_rate: "",
  carbon_factor: null,
  water_requirement: "",
  soil_type: "",
  description: "",
  image_url: "",
  image_path: "",
  is_active: true,
  // Extended default initial values
  leaf_type: "",
  canopy_diameter: null,
  average_height: null,
  lifespan: null,
  flowering_season: "",
  fruiting_season: "",
  root_system: "",
};