import { createFileRoute } from "@tanstack/react-router";
import { Loader2, MapPin } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventLocationMap } from "@/components/planting-events/EventLocationMap";
import { TreeHealthCard } from "@/components/trees/TreeHealthCard";
import { TreeMeasurements } from "@/components/trees/TreeMeasurements";
import { TreeGrowthChart } from "@/components/trees/TreeGrowthChart";
import { TreeMaintenance } from "@/components/trees/TreeMaintenance";
import { TreePhotos } from "@/components/trees/TreePhotos";
import { TreeVerificationHistory } from "@/components/trees/TreeVerificationHistory";
import { TreeCarbonCard } from "@/components/trees/TreeCarbonCard";
import { TreeAssignments } from "@/components/trees/TreeAssignments";
import { TreeTimeline } from "@/components/trees/TreeTimeline";
import { TreeInspectionCard } from "@/components/trees/TreeInspectionCard";
import { TreeInspectionSummary } from "@/components/trees/TreeInspectionSummary";
import { TreeMonitoringTimeline } from "@/components/trees/TreeMonitoringTimeline";
import { TreeInspectionHistory } from "@/components/trees/TreeInspectionHistory";
import { TreeInspectionPhotos } from "@/components/trees/TreeInspectionPhotos";
import { useTreeDetails } from "@/hooks/trees/useTreeDetails";

export const Route = createFileRoute("/_authenticated/trees/$treeId")({
  head: () => ({ meta: [{ title: "Tree — EcoTrack Novatic" }] }),
  component: TreeDetail,
});

function TreeDetail() {
  const { treeId } = Route.useParams();
  const details = useTreeDetails(treeId);

  if (details.isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading tree…
      </div>
    );
  }

  if (details.error || !details.data) {
    return <p className="py-16 text-center text-sm text-destructive">Couldn't load this tree.</p>;
  }

  const { tree, species, project, organization, plantingEvent, batch, currentAssignment, carbonEstimate } = details.data;
  const t = tree as any;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.tag_code}
        description={species ? `${species.common_name}${species.scientific_name ? ` (${species.scientific_name})` : ""}` : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Project</dt>
                  <dd className="font-medium">{project?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Organization</dt>
                  <dd className="font-medium">{organization?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Planting event</dt>
                  <dd className="font-medium">{plantingEvent?.title ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Batch</dt>
                  <dd className="font-medium">{batch ? `${batch.quantity} trees` : "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Planting date</dt>
                  <dd className="font-medium">{t.planting_date ?? t.planted_at ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium capitalize">{t.survival_status ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Verification</dt>
                  <dd className="font-medium capitalize">{t.verification_status ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Height / DBH</dt>
                  <dd className="font-medium">
                    {t.height ?? "—"} cm / {t.dbh ?? "—"} cm
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <EventLocationMap
                mode="preview"
                value={{
                  latitude: t.latitude,
                  longitude: t.longitude,
                  location_name: "",
                  town: t.town ?? "",
                  lga: t.lga ?? "",
                  state: t.state ?? "",
                  country: t.country ?? "",
                }}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                {[t.town, t.lga, t.state, t.country].filter(Boolean).join(", ") || "No location set"}
              </p>
            </CardContent>
          </Card>

          <TreeCarbonCard carbonEstimate={carbonEstimate} />
          <TreeAssignments treeId={treeId} currentAssignment={currentAssignment} />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Tabs defaultValue="health">
            <TabsList className="flex-wrap">
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="measurements">Measurements</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="health">
              <TreeHealthCard treeId={treeId} currentHealthStatus={t.health_status ?? null} />
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-6">
              <TreeInspectionCard treeId={treeId} />
              <TreeInspectionSummary treeId={treeId} />
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Visit timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <TreeMonitoringTimeline treeId={treeId} />
                </CardContent>
              </Card>
              <TreeInspectionHistory treeId={treeId} />
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Inspection photos</CardTitle>
                </CardHeader>
                <CardContent>
                  <TreeInspectionPhotos treeId={treeId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="measurements" className="space-y-6">
              <TreeGrowthChart treeId={treeId} />
              <TreeMeasurements treeId={treeId} />
            </TabsContent>

            <TabsContent value="maintenance">
              <TreeMaintenance treeId={treeId} />
            </TabsContent>

            <TabsContent value="verification">
              <TreeVerificationHistory treeId={treeId} />
            </TabsContent>

            <TabsContent value="photos">
              <TreePhotos treeId={treeId} />
            </TabsContent>

            <TabsContent value="timeline">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <TreeTimeline treeId={treeId} plantedDate={t.planting_date ?? t.planted_at ?? null} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
