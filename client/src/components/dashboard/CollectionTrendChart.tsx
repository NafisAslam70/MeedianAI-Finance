import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CollectionTrendProps {
  data: Array<{
    month: string;
    collection: number;
    expected: number;
  }>;
}

export default function CollectionTrendChart({ data }: CollectionTrendProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="finance-card" data-testid="card-collection-trend">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Collection Trend</CardTitle>
            <Select defaultValue="12months">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12months">Last 12 months</SelectItem>
                <SelectItem value="current">Current year</SelectItem>
                <SelectItem value="compare">Compare years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
            <div className="text-center">
              <i className="fas fa-chart-line text-4xl text-muted-foreground mb-3"></i>
              <p className="text-muted-foreground">No data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="finance-card" data-testid="card-collection-trend">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Monthly Collection Trend</CardTitle>
          <Select defaultValue="12months">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="current">Current year</SelectItem>
              <SelectItem value="compare">Compare years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-muted-foreground"
              />
              <YAxis 
                className="text-muted-foreground"
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="collection" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                name="Actual Collection"
              />
              <Line 
                type="monotone" 
                dataKey="expected" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--muted-foreground))", strokeWidth: 2 }}
                name="Expected Collection"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
