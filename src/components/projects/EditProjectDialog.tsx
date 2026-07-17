import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useUpdateProject } from "@/hooks/projects/useUpdateProject";
import { validateProjectForm, type ProjectFormErrors, type ProjectFormValues } from "@/lib/validation/projectSchema";

export interface EditableProject {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  town: string | null;
  lga: string | null;
  state: string | null;
  country: string | null;
  target_trees: number | null;
  start_date: string | null;
  end_date: string | null;
  budget_total: number | null;
}

function toFormValues(project: EditableProject): ProjectFormValues {
  return {
    organization_id: project.organization_id,
    name: project.name,
    description: project.description ?? "",
    status: project.status,
    location_name: project.location_name ?? "",
    latitude: project.latitude,
    longitude: project.longitude,
    town: project.town ?? "",
    lga: project.lga ?? "",
    state: project.state ?? "",
    country: project.country ?? "",
    target_trees: project.target_trees,
    start_date: project.start_date ?? "",
    end_date: project.end_date ?? "",
    budget_total: project.budget_total,
  };
}

interface EditProjectDialogProps {
  project: EditableProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const [values, setValues] = useState<ProjectFormValues>(toFormValues(project));
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const updateProject = useUpdateProject();

  useEffect(() => {
    setValues(toFormValues(project));
    setErrors({});
  }, [project]);

  const handleChange = (patch: Partial<ProjectFormValues>) => setValues((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    const validationErrors = validateProjectForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Check the highlighted fields");
      return;
    }

    updateProject.mutate(
      { id: project.id, values },
      {
        onSuccess: () => {
          toast.success("Project updated");
          onOpenChange(false);
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit {project.name}</DialogTitle>
          <DialogDescription>Update the project's details.</DialogDescription>
        </DialogHeader>
        <ProjectForm
          values={values}
          errors={errors}
          isEditing
          isSubmitting={updateProject.isPending}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
