import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import TrendChart from "@/components/charts/TrendChart";
import { useFinancePeriod } from "@/context/FinancePeriodContext";

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const { year: activeYear, years, setYear: setActiveYear } = useFinancePeriod();
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({
    from: new Date(2023, 3, 1), // April 1, 2023
    to: new Date()
  });

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats", activeYear],
    queryFn: () => fetch(`/api/dashboard/stats?academicYear=${encodeURIComponent(activeYear)}`).then(res => res.json()),
    enabled: Boolean(activeYear),
  });

  const { data: classCollections, isLoading: collectionsLoading } = useQuery({
    queryKey: ["/api/dashboard/class-collections", activeYear],
    queryFn: () => fetch(`/api/dashboard/class-collections?academicYear=${encodeURIComponent(activeYear)}`).then(res => res.json()),
    enabled: Boolean(activeYear),
  });

  const { data: feeStructureOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ["/api/dashboard/fee-structure-overview", activeYear],
    queryFn: () => fetch(`/api/dashboard/fee-structure-overview?academicYear=${encodeURIComponent(activeYear)}`).then(res => res.json()),
    enabled: Boolean(activeYear),
  });

  const { data: collectionTrend, isLoading: trendLoading } = useQuery({
    queryKey: ["/api/dashboard/collection-trend", activeYear],
    queryFn: () => fetch(`/api/dashboard/collection-trend?academicYear=${encodeURIComponent(activeYear)}`).then(res => res.json()),
    enabled: Boolean(activeYear),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const generatePDFReport = () => {
    // TODO: Implement PDF generation
    console.log('Generating PDF report...');
  };

  const generateExcelReport = () => {
    // TODO: Implement Excel export
    console.log('Generating Excel report...');
  };

  const sortedYears = [...years].sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return b.code.localeCompare(a.code);
  });

  const handleYearChange = (value: string) => {
    setActiveYear(value);
  };

  if (!activeYear) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Financial Reports</h2>
            <p className="text-muted-foreground">Select an academic year to view reports.</p>
          </div>
        </div>
      </div>
    );
  }

  if (statsLoading || collectionsLoading || overviewLoading || trendLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Financial Reports</h2>
          <p className="text-muted-foreground">Comprehensive financial analytics and reporting</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={activeYear} onValueChange={handleYearChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortedYears.map((year) => (
                <SelectItem key={year.code} value={year.code}>
                  {year.name || year.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generatePDFReport} variant="outline" data-testid="button-pdf-report">
            <i className="fas fa-file-pdf mr-2"></i>
            PDF
          </Button>
          <Button onClick={generateExcelReport} variant="outline" data-testid="button-excel-report">
            <i className="fas fa-file-excel mr-2"></i>
            Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="finance-card" data-testid="card-total-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-total-revenue">
                    {formatCurrency(dashboardStats.monthlyCollection)}
                  </p>
                  <div className="flex items-center space-x-1 mt-2">
                    <i className={`fas fa-arrow-${dashboardStats.collectionGrowth >= 0 ? 'up' : 'down'} text-${dashboardStats.collectionGrowth >= 0 ? 'secondary' : 'destructive'} text-sm`}></i>
                    <span className={`text-${dashboardStats.collectionGrowth >= 0 ? 'secondary' : 'destructive'} text-sm font-medium`}>
                      {Math.abs(dashboardStats.collectionGrowth)}% vs last period
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-coins text-secondary text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="finance-card" data-testid="card-collection-rate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Collection Rate</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-collection-rate">
                    {dashboardStats.expectedMonthly > 0 ? 
                      Math.round((dashboardStats.monthlyCollection / dashboardStats.expectedMonthly) * 100) : 0
                    }%
                  </p>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className="h-2 rounded-full bg-primary transition-all duration-300"
                      style={{ 
                        width: `${dashboardStats.expectedMonthly > 0 ? 
                          Math.min((dashboardStats.monthlyCollection / dashboardStats.expectedMonthly) * 100, 100) : 0
                        }%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-percentage text-primary text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="finance-card" data-testid="card-outstanding-amount">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Outstanding</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-outstanding-amount">
                    {formatCurrency(dashboardStats.deficit)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Pending collections
                  </p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-destructive text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="finance-card" data-testid="card-transport-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Transport Revenue</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-transport-revenue">
                    {formatCurrency(dashboardStats.vanCollection)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {dashboardStats.vanStudents} students
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-bus text-purple-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Reports */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="collections" data-testid="tab-collections">Collections</TabsTrigger>
          <TabsTrigger value="outstanding" data-testid="tab-outstanding">Outstanding</TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Collection Trend Chart */}
            <Card className="finance-card">
              <CardHeader>
                <CardTitle>Collection Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart data={collectionTrend || []} />
              </CardContent>
            </Card>

            {/* Class-wise Performance */}
            <Card className="finance-card">
              <CardHeader>
                <CardTitle>Class-wise Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(classCollections) && classCollections.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between" data-testid={`class-performance-${index}`}>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="font-medium text-foreground">{item.className}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-foreground">
                          {formatCurrency(item.collection)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.studentCount} students
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fee Structure Overview Table */}
          {feeStructureOverview?.items && (
            <Card className="finance-card">
              <CardHeader>
                <CardTitle>Fee Structure Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Class</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Students</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Expected</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Collected</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Rate</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeStructureOverview.items.map((item: any, index: number) => {
                        const collectionRate = item.expectedMonthly > 0 
                          ? Math.round((item.actualCollection / item.expectedMonthly) * 100) 
                          : 0;
                        
                        return (
                          <tr key={index} className="border-b border-border hover:bg-muted/50" data-testid={`fee-overview-row-${index}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary">{item.classCode}</span>
                                </div>
                                <span className="font-medium text-foreground">{item.className}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="outline">{item.totalStudents}</Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                              {formatCurrency(item.expectedMonthly)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                              {formatCurrency(item.actualCollection)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Badge className={
                                collectionRate >= 80 ? 'bg-secondary/10 text-secondary' :
                                collectionRate >= 60 ? 'bg-accent/10 text-accent' :
                                'bg-destructive/10 text-destructive'
                              }>
                                {collectionRate}%
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-mono font-semibold ${item.variance >= 0 ? 'stat-positive' : 'stat-negative'}`}>
                                {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collections">
          <Card className="finance-card">
            <CardHeader>
              <CardTitle>Collection Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <i className="fas fa-chart-bar text-4xl text-muted-foreground mb-3"></i>
                  <p className="text-muted-foreground">Detailed collection analysis coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding">
          <Card className="finance-card">
            <CardHeader>
              <CardTitle>Outstanding Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <i className="fas fa-exclamation-triangle text-4xl text-muted-foreground mb-3"></i>
                  <p className="text-muted-foreground">Outstanding payments analysis coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card className="finance-card">
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <i className="fas fa-analytics text-4xl text-muted-foreground mb-3"></i>
                  <p className="text-muted-foreground">Advanced analytics dashboard coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
