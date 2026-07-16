import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, TreePine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useTreeBatch, useBatchTreesPreview } from "@/hooks/useTreeBatch";

export const Route = createFileRoute("/_authenticated/batches/$batchId")({
  head: () => ({ meta: [{ title: "Batch — EcoTrack Novatic" }] }),
  component: BatchDetail,
});

function BatchDetail() {
  const { batchId } = Route.useParams();
  const batch = useTreeBatch(batchId);
  const preview = useBatchTreesPreview(batchId);

  if (batch.isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading batch…
      </div>
    );
  }

  if (batch.error || !batch.data) {
    return <p className="py-16 text-center text-sm text-destructive">Couldn't load this batch.</p>;
  }

  const { data } = batch;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${data.tree_species?.common_name ?? "Tree"} batch`}
        description={`${data.quantity} trees · ${data.projects?.name ?? "Unknown project"}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.quantity}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Species</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{data.tree_species?.common_name ?? "—"}</div>
            <div className="text-xs text-muted-foreground">
              {data.tree_species?.species_code ?? ""}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planting date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{data.planting_date ?? "—"}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{data.location_name || data.town || "—"}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">
            Trees in this batch {preview.data ? `(${preview.data.totalCount})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {preview.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading trees…</p>
          ) : !preview.data?.rows.length ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <TreePine className="h-6 w-6" />
              No trees found for this batch.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Tree code</th>
                      <th className="px-3 py-2 font-medium">Health</th>
                      <th className="px-3 py-2 font-medium">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.data.rows.map((tree) => (
                      <tr key={tree.id}>
                        <td className="px-3 py-2 font-mono text-xs">{tree.tag_code}</td>
                        <td className="px-3 py-2 capitalize">{tree.health}</td>
                        <td className="px-3 py-2 capitalize">{tree.verification_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.data.totalCount > preview.data.rows.length && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing the first {preview.data.rows.length} of {preview.data.totalCount} trees.
                  Full sortable/filterable tree listing arrives with the Tree Detail Pages phase.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Link to="/trees/register" className="text-sm text-primary underline underline-offset-4">
        Register another batch
      </Link>
    </div>
  );
}
