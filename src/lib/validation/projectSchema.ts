import { z } from "zod";

export const projectSchema = z.object({
  organization_id: z.string().uuid({ message: "Select an organization" }),
  name: z.string().min(1, "Project name is required"),
  description: z.string(),
  status: z.string().min(1, "Select a status"),
  location_name: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  town: z.string(),
  lga: z.string(),
  state: z.string(),
  country: z.string(),
  target_trees: z.number().int().min(0, "Must be 0 or greater").nullable(),
  start_date: z.string(),
  end_date: z.string(),
  budget_total: z.number().min(0, "Must be 0 or greater").nullable(),
}).refine(
  (v) => !v.start_date || !v.end_date || v.start_date <= v.end_date,
  { message: "End date must be after start date", path: ["end_date"] },
);

export type ProjectFormValues = z.infer<typeof projectSchema>;
export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>;

export function validateProjectForm(values: ProjectFormValues): ProjectFormErrors {
  const result = projectSchema.safeParse(values);
  if (result.success) return {};

  const errors: ProjectFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof ProjectFormValues | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

export const emptyProjectForm: ProjectFormValues = {
  organization_id: "",
  name: "",
  description: "",
  status: "planning",
  location_name: "",
  latitude: null,
  longitude: null,
  town: "",
  lga: "",
  state: "",
  country: "",
  target_trees: null,
  start_date: "",
  end_date: "",
  budget_total: null,
};
