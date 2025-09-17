import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface TrendDataPoint {
  month?: string;
  period?: string;
  name?: string;
  collection?: number;
  expected?: number;
  value?: number;
  revenue?: number;
  expenses?: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  type?: 'line' | 'bar';
  showExpected?: boolean;
  height?: number;
  color?: string;
}

export default function TrendChart({ 
  data = [], 
  type = 'line', 
  showExpected = true,
  height = 300,
  color = "hsl(var(--primary))"
}: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`h-${height} flex items-center justify-center bg-muted/50 rounded-lg`}>
        <div className="text-center">
          <i className="fas fa-chart-line text-4xl text-muted-foreground mb-3"></i>
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTooltipValue = (value: number) => {
    return formatCurrency(value);
  };

  // Determine the x-axis key
  const xAxisKey = data[0]?.month ? 'month' : data[0]?.period ? 'period' : 'name';

  if (type === 'bar') {
    return (
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey={xAxisKey}
              className="text-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-muted-foreground"
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number, name: string) => [formatTooltipValue(value), name]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Bar 
              dataKey="collection" 
              fill={color}
              name="Collection"
              radius={[4, 4, 0, 0]}
            />
            {showExpected && data[0]?.expected !== undefined && (
              <Bar 
                dataKey="expected" 
                fill="hsl(var(--muted-foreground))"
                name="Expected"
                radius={[4, 4, 0, 0]}
                opacity={0.6}
              />
            )}
            {data[0]?.revenue !== undefined && (
              <Bar 
                dataKey="revenue" 
                fill="hsl(var(--secondary))"
                name="Revenue"
                radius={[4, 4, 0, 0]}
              />
            )}
            {data[0]?.expenses !== undefined && (
              <Bar 
                dataKey="expenses" 
                fill="hsl(var(--destructive))"
                name="Expenses"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey={xAxisKey}
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-muted-foreground"
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatTooltipValue(value), name]}
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
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: color }}
            name="Actual Collection"
          />
          {showExpected && data[0]?.expected !== undefined && (
            <Line 
              type="monotone" 
              dataKey="expected" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth={2}
              strokeDasharray="8 8"
              dot={{ fill: "hsl(var(--muted-foreground))", strokeWidth: 2, r: 3 }}
              name="Expected Collection"
            />
          )}
          {data[0]?.value !== undefined && (
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: color }}
              name="Value"
            />
          )}
          {data[0]?.revenue !== undefined && (
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--secondary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "hsl(var(--secondary))" }}
              name="Revenue"
            />
          )}
          {data[0]?.expenses !== undefined && (
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="hsl(var(--destructive))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--destructive))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "hsl(var(--destructive))" }}
              name="Expenses"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
