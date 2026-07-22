import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendPoint } from "@/hooks/trees/useTreeAnalytics";

interface TreeAnalyticsCardProps {
  title: string;
  data: TrendPoint[];
  dataKey: string;
  seriesLabel: string;
  color?: string;
  isLoading?: boolean;
}

export function TreeAnalyticsCard({ title, data, dataKey, seriesLabel, color = "#16a34a", isLoading }: TreeAnalyticsCardProps) {
  const chartData = data.map((d) => ({
    ...d,
    month: new Date(d.month).toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
  }));

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        ) : chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No data for this period yet.</p>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey={dataKey} name={seriesLabel} stroke={color} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
