import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface Payment {
  id: number;
  studentName: string;
  className: string;
  amount: number;
  paymentType: string;
  paymentDate: string;
  status: string;
}

interface RecentPaymentsProps {
  payments: Payment[];
}

export default function RecentPayments({ payments }: RecentPaymentsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'verified': 'bg-secondary/10 text-secondary',
      'pending': 'bg-accent/10 text-accent',
      'rejected': 'bg-destructive/10 text-destructive',
    };

    return variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  const getPaymentTypeBadge = (type: string) => {
    const variants = {
      'monthly': 'bg-secondary/10 text-secondary',
      'transport': 'bg-purple-100 text-purple-600',
      'admission': 'bg-primary/10 text-primary',
      'supply': 'bg-accent/10 text-accent',
    };

    return variants[type as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  if (!payments || payments.length === 0) {
    return (
      <Card className="finance-card" data-testid="card-recent-payments">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <Link href="/payments">
              <Button variant="link" className="text-primary hover:text-primary/80 text-sm font-medium">
                View All <i className="fas fa-arrow-right ml-1"></i>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
            <div className="text-center">
              <i className="fas fa-credit-card text-4xl text-muted-foreground mb-3"></i>
              <p className="text-muted-foreground">No recent payments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="finance-card" data-testid="card-recent-payments">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Payments</CardTitle>
          <Link href="/payments">
            <Button variant="link" className="text-primary hover:text-primary/80 text-sm font-medium">
              View All <i className="fas fa-arrow-right ml-1"></i>
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Class</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 10).map((payment, index) => (
                <tr key={payment.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-payment-${payment.id}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {payment.studentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                      <span className="font-medium text-foreground" data-testid={`text-student-name-${index}`}>
                        {payment.studentName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground" data-testid={`text-class-${index}`}>
                    {payment.className}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-foreground" data-testid={`text-amount-${index}`}>
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={`${getPaymentTypeBadge(payment.paymentType)} text-xs`}>
                      {payment.paymentType}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground" data-testid={`text-date-${index}`}>
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={`${getStatusBadge(payment.status)} text-xs`}>
                      {payment.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
