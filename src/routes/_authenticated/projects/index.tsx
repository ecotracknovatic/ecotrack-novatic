import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderKanban, Loader2, MapPin, Trees } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useProjects } from "@/hooks/useProjects";

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data, isLoading } = useProjects();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading projects...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description="Manage all EcoTrack projects" />

      <div className="flex justify-end">
        <Button>+ New Project</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((project) => (
          <Card key={project.id} className="rounded-2xl">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">{project.name}</h2>
              </div>

              <p className="text-sm capitalize">Status: {project.status}</p>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                {project.location_name ?? "Unknown"}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Trees className="h-4 w-4" />
                Target: {project.target_trees} trees
              </div>

              <Button asChild className="w-full">
                <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                  View Details
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
