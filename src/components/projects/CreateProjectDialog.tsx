import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useCreateProject } from "@/hooks/projects/useCreateProject";
import { emptyProjectForm, validateProjectForm, type ProjectFormErrors } from "@/lib/validation/projectSchema";
import type { ProjectFormValues } from "@/lib/validation/projectSchema";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ProjectFormValues>(emptyProjectForm);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const createProject = useCreateProject();

  const reset = () => {
    setValues(emptyProjectForm);
    setErrors({});
  };

  const handleChange = (patch: Partial<ProjectFormValues>) => setValues((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    const validationErrors = validateProjectForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Check the highlighted fields");
      return;
    }

    createProject.mutate(values, {
      onSuccess: (project) => {
        toast.success(`${project.name} created`);
        reset();
        setOpen(false);
      },
      onError: (error: Error) => toast.error(error.message),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>Projects belong to an organization. Complete the details below.</DialogDescription>
        </DialogHeader>
        <ProjectForm
          values={values}
          errors={errors}
          isEditing={false}
          isSubmitting={createProject.isPending}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
