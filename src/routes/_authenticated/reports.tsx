import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileBarChart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — EcoTrack Novatic" }] }),
  component: Reports,
});

function Reports() {
  const { data } = useQuery({
    queryKey: ["report-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, target_trees, trees(id, verification_status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const download = (rows: any[]) => {
    const header = "Project,Status,Target trees,Registered,Verified\n";
    const body = rows
      .map((r) => {
        const registered = r.trees?.length ?? 0;
        const verified =
          r.trees?.filter((t: any) => t.verification_status === "approved").length ?? 0;
        return [r.name, r.status, r.target_trees ?? 0, registered, verified].join(",");
      })
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecotrack-projects-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Project summaries and downloadable CSV exports."
        actions={
          <Button onClick={() => download(data ?? [])} disabled={!data?.length} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" /> Project performance
          </CardTitle>
          <CardDescription>Trees registered and verified per project.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!data?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No projects yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r: any) => {
                    const registered = r.trees?.length ?? 0;
                    const verified =
                      r.trees?.filter((t: any) => t.verification_status === "approved").length ?? 0;
                    return (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">{r.name}</td>
                        <td className="px-4 py-3 capitalize">{r.status}</td>
                        <td className="px-4 py-3">{r.target_trees ?? 0}</td>
                        <td className="px-4 py-3">{registered}</td>
                        <td className="px-4 py-3">{verified}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
