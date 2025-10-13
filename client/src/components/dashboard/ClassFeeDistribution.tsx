import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ClassCollection {
  classId: number;
  className: string;
  section?: string | null;
  collection: number;
  studentCount: number;
  expectedCollection?: number;
  hostellers?: number;
  dayScholars?: number;
  color: string;
}

interface ClassFeeDistributionProps {
  data: ClassCollection[];
}

export default function ClassFeeDistribution({ data }: ClassFeeDistributionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!data || data.length === 0) {
    return (
      <Card className="finance-card" data-testid="card-class-distribution">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Class-wise Collections</CardTitle>
            <Link href="/classes">
              <Button variant="link" className="text-primary hover:text-primary/80 text-sm font-medium">
                View Details <i className="fas fa-arrow-right ml-1"></i>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
            <div className="text-center">
              <i className="fas fa-graduation-cap text-4xl text-muted-foreground mb-3"></i>
              <p className="text-muted-foreground">No data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="finance-card" data-testid="card-class-distribution">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Class-wise Collections</CardTitle>
          <Link href="/classes">
            <Button variant="link" className="text-primary hover:text-primary/80 text-sm font-medium">
              View Details <i className="fas fa-arrow-right ml-1"></i>
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(0, 5).map((item, index) => (
            <div key={item.classId ?? index} className="flex items-center justify-between" data-testid={`row-class-${item.classId ?? index}`}>
              <div className="flex items-center space-x-3">
                <div 
                  className={`w-3 h-3 rounded-full`}
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="font-medium text-foreground">
                  {item.className}
                  {item.section ? ` (${item.section})` : ''}
                </span>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold text-foreground" data-testid={`text-collection-${index}`}>
                  {formatCurrency(item.collection)}
                </p>
                <p className="text-sm text-muted-foreground" data-testid={`text-students-${index}`}>
                  {item.studentCount} students
                </p>
              </div>
            </div>
          ))}
          {data.length > 5 && (
            <div className="pt-3 border-t border-border">
              <Link href="/classes">
                <Button variant="ghost" className="w-full text-primary hover:text-primary/80 text-sm font-medium py-2">
                  View All Classes
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
