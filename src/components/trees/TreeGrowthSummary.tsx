import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PerformanceRow } from "@/hooks/trees/useTreeAnalytics";

export function TreeGrowthSummary({
  title,
  rows,
  labelKey,
}: {
  title: string;
  rows: PerformanceRow[];
  labelKey: "species_name" | "project_name";
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <div className="divide-y">
            {rows.map((row) => (
              <div key={row[labelKey]} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-foreground">{row[labelKey]}</span>
                <span className="text-muted-foreground">
                  {row.tree_count} trees · {row.survival_rate !== null ? `${row.survival_rate}%` : "—"} survival
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
