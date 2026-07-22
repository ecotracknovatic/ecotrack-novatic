import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS: Record<string, string> = {
  Healthy: "#16a34a",
  healthy: "#16a34a",
  "Needs Attention": "#d97706",
  needs_attention: "#d97706",
  Diseased: "#ea580c",
  diseased: "#ea580c",
  Dead: "#dc2626",
  dead: "#dc2626",
  Removed: "#64748b",
  removed: "#64748b",
  Unknown: "#94a3b8",
  unknown: "#94a3b8",
};

export function TreeHealthDistribution({ distribution }: { distribution: Record<string, number> }) {
  const data = Object.entries(distribution).map(([status, count]) => ({ status, count }));

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Health distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No health data yet.</p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="status" fontSize={11} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.map((entry) => (
                    <Cell key={entry.status} fill={COLORS[entry.status] ?? "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
