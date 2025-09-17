import { Card, CardContent } from "@/components/ui/card";

interface FinancialStats {
  totalStudents: number;
  totalHostellers: number;
  totalDayScholars: number;
  monthlyCollection: number;
  expectedMonthly: number;
  vanCollection: number;
  vanStudents: number;
  collectionGrowth: number;
  deficit: number;
}

interface FinancialOverviewProps {
  stats: FinancialStats;
}

export default function FinancialOverview({ stats }: FinancialOverviewProps) {
  if (!stats) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="finance-card" data-testid="card-total-students">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold text-foreground" data-testid="text-total-students">
                {stats.totalStudents}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full" data-testid="text-hostellers">
                  {stats.totalHostellers} Hostellers
                </span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full" data-testid="text-day-scholars">
                  {stats.totalDayScholars} Day Scholars
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-primary text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="finance-card" data-testid="card-monthly-collection">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Monthly Collection</p>
              <p className="text-3xl font-bold text-foreground" data-testid="text-monthly-collection">
                {formatCurrency(stats.monthlyCollection)}
              </p>
              <div className="flex items-center space-x-1 mt-2">
                <i className={`fas fa-arrow-${stats.collectionGrowth >= 0 ? 'up' : 'down'} text-${stats.collectionGrowth >= 0 ? 'secondary' : 'destructive'} text-sm`}></i>
                <span className={`text-${stats.collectionGrowth >= 0 ? 'secondary' : 'destructive'} text-sm font-medium`} data-testid="text-collection-growth">
                  {Math.abs(stats.collectionGrowth)}% vs last month
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-line text-secondary text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="finance-card" data-testid="card-expected-monthly">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Expected Monthly</p>
              <p className="text-3xl font-bold text-foreground" data-testid="text-expected-monthly">
                {formatCurrency(stats.expectedMonthly)}
              </p>
              <div className="flex items-center space-x-1 mt-2">
                <i className="fas fa-arrow-down text-destructive text-sm"></i>
                <span className="text-destructive text-sm font-medium" data-testid="text-deficit">
                  {formatCurrency(stats.deficit)} deficit
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-target text-accent text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="finance-card" data-testid="card-van-collections">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Van Collections</p>
              <p className="text-3xl font-bold text-foreground" data-testid="text-van-collection">
                {formatCurrency(stats.vanCollection)}
              </p>
              <div className="flex items-center space-x-1 mt-2">
                <span className="text-muted-foreground text-sm" data-testid="text-van-students">
                  {stats.vanStudents} students enrolled
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-bus text-purple-600 text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
