
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  FolderKanban,
  Loader2,
  MapPin,
  Trees,
  Search,
  MoreVertical,
  Archive,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PageHeader } from "@/components/page-header";

import { useProjects } from "@/hooks/useProjects";

import {
  useArchiveProject,
} from "@/hooks/projects/useProjectLifecycle";

import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import {
  EditProjectDialog,
  type EditableProject,
} from "@/components/projects/EditProjectDialog";

import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data = [], isLoading } = useProjects();

  const archiveProject = useArchiveProject();

  const [search, setSearch] = useState("");

  const [editingProject, setEditingProject] =
    useState<EditableProject | null>(null);

  const [deletingProject, setDeletingProject] =
    useState<EditableProject | null>(null);

  const filteredProjects = useMemo(() => {
    const query = search.toLowerCase();

    return data.filter((project) => {
      return (
        project.name?.toLowerCase().includes(query) ||
        project.location_name?.toLowerCase().includes(query) ||
        project.status?.toLowerCase().includes(query)
      );
    });
  }, [data, search]);

  const totalProjects = data.length;

  const activeProjects = data.filter(
    (p) => p.status !== "archived"
  ).length;

  const archivedProjects = data.filter(
    (p) => p.status === "archived"
  ).length;

  const totalTrees = data.reduce(
    (sum, p) => sum + (p.target_trees ?? 0),
    0
  );

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading projects...
      </div>
    );
  }
    return (
    <div className="space-y-6">

      <PageHeader
        title="Projects"
        description="Manage all EcoTrack environmental restoration projects."
        actions={<CreateProjectDialog />}
      />

      <div className="grid gap-4 md:grid-cols-4">

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              Total Projects
            </div>

            <div className="mt-2 text-3xl font-bold">
              {totalProjects}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              Active
            </div>

            <div className="mt-2 text-3xl font-bold text-green-600">
              {activeProjects}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              Archived
            </div>

            <div className="mt-2 text-3xl font-bold text-orange-600">
              {archivedProjects}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              Target Trees
            </div>

            <div className="mt-2 text-3xl font-bold">
              {totalTrees.toLocaleString()}
            </div>
          </CardContent>
        </Card>

      </div>

      <Input
        placeholder="Search projects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredProjects.length === 0 ? (
        <Card>

          <CardContent className="flex flex-col items-center justify-center py-16">

            <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />

            <h3 className="text-lg font-semibold">
              No projects found
            </h3>

            <p className="mt-2 text-center text-muted-foreground">
              Create your first environmental project to begin tracking trees,
              restoration activities and impact.
            </p>

            <div className="mt-6">
              <CreateProjectDialog />
            </div>

          </CardContent>

        </Card>
      ) : (

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

          {filteredProjects.map((project) => (

            <Card
              key={project.id}
              className="relative rounded-2xl transition hover:shadow-lg"
            >

              <DropdownMenu>

                <DropdownMenuTrigger asChild>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-3"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>

                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">

                  <DropdownMenuItem
                    onClick={() =>
                      setEditingProject(project as EditableProject)
                    }
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() =>
                      archiveProject.mutate(project.id, {
                        onSuccess: () =>
                          toast.success("Project archived"),
                        onError: (error: Error) =>
                          toast.error(error.message),
                      })
                    }
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() =>
                      setDeletingProject(project as EditableProject)
                    }
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>

                </DropdownMenuContent>

              </DropdownMenu>

              <CardHeader>

                <div className="flex items-center justify-between pr-8">

                  <CardTitle className="text-lg">
                    {project.name}
                  </CardTitle>

                  <ProjectStatusBadge
                    status={project.status}
                  />

                </div>

              </CardHeader>

              <CardContent className="space-y-4">

                <div className="flex items-center gap-2 text-sm">

                  <MapPin className="h-4 w-4 text-primary" />

                  <span>
                    {project.location_name ?? "Unknown location"}
                  </span>

                </div>

                <div className="flex items-center gap-2 text-sm">

                  <Trees className="h-4 w-4 text-primary" />

                  <span>
                    Target Trees:
                    {" "}
                    {(project.target_trees ?? 0).toLocaleString()}
                  </span>

                </div>

                <Button
                  className="w-full"
                  asChild
                >
                  <a href={`/projects/${project.id}`}>
                    View Project
                  </a>
                </Button>

              </CardContent>

            </Card>

          ))}

        </div>

      )}
            {editingProject && (
        <EditProjectDialog
          project={editingProject}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setEditingProject(null);
            }
          }}
        />
      )}

      {deletingProject && (
        <DeleteProjectDialog
          projectId={deletingProject.id}
          projectName={deletingProject.name}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingProject(null);
            }
          }}
          onDeleted={() => {
            setDeletingProject(null);
          }}
        />
      )}
    </div>
  );
}