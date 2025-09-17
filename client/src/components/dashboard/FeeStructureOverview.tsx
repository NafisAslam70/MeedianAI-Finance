import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface FeeStructureItem {
  className: string;
  classCode: string;
  totalStudents: number;
  hostellers: number;
  dayScholars: number;
  hostellerFee: number;
  dayScholarFee: number;
  expectedMonthly: number;
  actualCollection: number;
  variance: number;
}

interface FeeStructureOverviewProps {
  overview: {
    items: FeeStructureItem[];
    totals: {
      totalStudents: number;
      expectedMonthly: number;
      actualCollection: number;
      variance: number;
    };
  };
}

export default function FeeStructureOverview({ overview }: FeeStructureOverviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!overview || !overview.items || overview.items.length === 0) {
    return (
      <Card className="finance-card" data-testid="card-fee-structure">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fee Structure Overview</CardTitle>
            <div className="flex items-center space-x-3">
              <Select defaultValue="2023-24">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023-24">Academic Year 2023-24</SelectItem>
                  <SelectItem value="2022-23">Academic Year 2022-23</SelectItem>
                </SelectContent>
              </Select>
              <Link href="/fee-management">
                <Button variant="outline" size="sm">
                  Manage Structure <i className="fas fa-cog ml-1"></i>
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
            <div className="text-center">
              <i className="fas fa-receipt text-4xl text-muted-foreground mb-3"></i>
              <p className="text-muted-foreground">No fee structure data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="finance-card" data-testid="card-fee-structure">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fee Structure Overview</CardTitle>
          <div className="flex items-center space-x-3">
            <Select defaultValue="2023-24">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023-24">Academic Year 2023-24</SelectItem>
                <SelectItem value="2022-23">Academic Year 2022-23</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/fee-management">
              <Button variant="outline" size="sm" data-testid="button-manage-structure">
                Manage Structure <i className="fas fa-cog ml-1"></i>
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Class</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Students</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Hosteller Fee</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Day Scholar Fee</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Expected Monthly</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actual Collection</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Variance</th>
              </tr>
            </thead>
            <tbody>
              {overview.items.map((item, index) => (
                <tr key={item.className} className="border-b border-border hover:bg-muted/50" data-testid={`row-class-${item.className.toLowerCase().replace(/\s+/g, '-')}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{item.classCode}</span>
                      </div>
                      <span className="font-medium text-foreground">{item.className}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="text-sm">
                      <span className="font-semibold text-foreground" data-testid={`text-total-students-${index}`}>
                        {item.totalStudents}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        <span data-testid={`text-hostellers-${index}`}>{item.hostellers}H</span> • <span data-testid={`text-day-scholars-${index}`}>{item.dayScholars}D</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-foreground" data-testid={`text-hosteller-fee-${index}`}>
                    {formatCurrency(item.hostellerFee)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-foreground" data-testid={`text-day-scholar-fee-${index}`}>
                    {formatCurrency(item.dayScholarFee)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-foreground" data-testid={`text-expected-${index}`}>
                    {formatCurrency(item.expectedMonthly)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-foreground" data-testid={`text-actual-${index}`}>
                    {formatCurrency(item.actualCollection)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-mono font-semibold ${item.variance >= 0 ? 'stat-positive' : 'stat-negative'}`} data-testid={`text-variance-${index}`}>
                      {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-muted/30">
              <tr>
                <td className="py-4 px-4 font-semibold text-foreground">Total</td>
                <td className="py-4 px-4 text-center font-semibold text-foreground" data-testid="text-total-students-footer">
                  {overview.totals.totalStudents}
                </td>
                <td className="py-4 px-4"></td>
                <td className="py-4 px-4"></td>
                <td className="py-4 px-4 text-right font-mono font-bold text-foreground" data-testid="text-total-expected">
                  {formatCurrency(overview.totals.expectedMonthly)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold text-foreground" data-testid="text-total-actual">
                  {formatCurrency(overview.totals.actualCollection)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold stat-negative" data-testid="text-total-variance">
                  {formatCurrency(overview.totals.variance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
