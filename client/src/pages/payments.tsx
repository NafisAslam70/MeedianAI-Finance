import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PaymentForm from "@/components/forms/PaymentForm";

export default function Payments() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ paymentId, verifiedBy }: { paymentId: number, verifiedBy: number }) => {
      return apiRequest("PATCH", `/api/payments/${paymentId}/verify`, { verifiedBy });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Success",
        description: "Payment verified successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to verify payment",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'verified': 'bg-secondary/10 text-secondary',
      'pending': 'bg-accent/10 text-accent',
      'rejected': 'bg-destructive/10 text-destructive',
      'partial': 'bg-muted text-muted-foreground',
    };

    return variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants = {
      'cash': 'bg-primary/10 text-primary',
      'upi': 'bg-purple-100 text-purple-600',
      'bank_transfer': 'bg-secondary/10 text-secondary',
      'cheque': 'bg-accent/10 text-accent',
      'online': 'bg-blue-100 text-blue-600',
    };

    return variants[method as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  const filteredPayments = payments?.filter((payment: any) => {
    const matchesSearch = payment.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          payment.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    
    const matchesTab = selectedTab === 'all' || 
                      (selectedTab === 'verified' && payment.status === 'verified') ||
                      (selectedTab === 'pending' && payment.status === 'pending') ||
                      (selectedTab === 'recent' && new Date(payment.paymentDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  const handleVerifyPayment = (paymentId: number) => {
    verifyMutation.mutate({ paymentId, verifiedBy: 1 }); // TODO: Get actual user ID
  };

  if (paymentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate summary stats
  const totalPayments = payments?.length || 0;
  const verifiedPayments = payments?.filter((p: any) => p.status === 'verified').length || 0;
  const pendingPayments = payments?.filter((p: any) => p.status === 'pending').length || 0;
  const totalAmount = payments?.reduce((sum: number, payment: any) => 
    sum + parseFloat(payment.amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Payment Management</h2>
          <p className="text-muted-foreground">Track and verify student payment transactions</p>
        </div>
        <Button 
          onClick={() => setIsPaymentFormOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90" 
          data-testid="button-add-payment"
        >
          <i className="fas fa-plus mr-2"></i>
          Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="finance-card" data-testid="card-total-payments">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Payments</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-total-payments">
                  {totalPayments}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-credit-card text-primary text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="finance-card" data-testid="card-verified-payments">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Verified</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-verified-payments">
                  {verifiedPayments}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-secondary text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="finance-card" data-testid="card-pending-payments">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-pending-payments">
                  {pendingPayments}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-accent text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="finance-card" data-testid="card-total-amount">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Amount</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-total-amount">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-money-bill-wave text-purple-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table with Tabs */}
      <Card className="finance-card">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all" data-testid="tab-all">All Payments</TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending">Pending</TabsTrigger>
                <TabsTrigger value="verified" data-testid="tab-verified">Verified</TabsTrigger>
                <TabsTrigger value="recent" data-testid="tab-recent">Recent</TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-4">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80"
                  data-testid="input-search-payments"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="all" className="mt-0">
              {!filteredPayments || filteredPayments.length === 0 ? (
                <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <i className="fas fa-credit-card text-4xl text-muted-foreground mb-3"></i>
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No payments found matching your search' : 'No payments found'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Class</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Method</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Reference</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment: any, index: number) => (
                        <tr key={payment.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-payment-${payment.id}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {payment.studentName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
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
                          <td className="py-3 px-4 text-right font-mono font-semibold text-foreground" data-testid={`text-amount-${index}`}>
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getPaymentMethodBadge(payment.paymentMethod)} data-testid={`badge-method-${index}`}>
                              {payment.paymentMethod?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono text-muted-foreground" data-testid={`text-reference-${index}`}>
                            {payment.referenceNumber || '-'}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground" data-testid={`text-date-${index}`}>
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusBadge(payment.status)} data-testid={`badge-status-${index}`}>
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {payment.status === 'pending' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleVerifyPayment(payment.id)}
                                  disabled={verifyMutation.isPending}
                                  data-testid={`button-verify-payment-${payment.id}`}
                                >
                                  <i className="fas fa-check text-secondary"></i>
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" data-testid={`button-view-payment-${payment.id}`}>
                                <i className="fas fa-eye text-primary"></i>
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-edit-payment-${payment.id}`}>
                                <i className="fas fa-edit text-muted-foreground"></i>
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-receipt-payment-${payment.id}`}>
                                <i className="fas fa-receipt text-accent"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            <TabsContent value="pending" className="mt-0">
              {!filteredPayments || filteredPayments.length === 0 ? (
                <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <i className="fas fa-credit-card text-4xl text-muted-foreground mb-3"></i>
                    <p className="text-muted-foreground">No pending payments found</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Class</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Method</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Reference</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment: any, index: number) => (
                        <tr key={payment.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-payment-${payment.id}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {payment.studentName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
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
                          <td className="py-3 px-4 text-right font-mono font-semibold text-foreground" data-testid={`text-amount-${index}`}>
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getPaymentMethodBadge(payment.paymentMethod)} data-testid={`badge-method-${index}`}>
                              {payment.paymentMethod?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono text-muted-foreground" data-testid={`text-reference-${index}`}>
                            {payment.referenceNumber || '-'}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground" data-testid={`text-date-${index}`}>
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleVerifyPayment(payment.id)}
                                disabled={verifyMutation.isPending}
                                data-testid={`button-verify-payment-${payment.id}`}
                              >
                                <i className="fas fa-check text-secondary"></i>
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-view-payment-${payment.id}`}>
                                <i className="fas fa-eye text-primary"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            <TabsContent value="verified" className="mt-0">
              {!filteredPayments || filteredPayments.length === 0 ? (
                <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <i className="fas fa-credit-card text-4xl text-muted-foreground mb-3"></i>
                    <p className="text-muted-foreground">No verified payments found</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Class</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Method</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Reference</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment: any, index: number) => (
                        <tr key={payment.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-payment-${payment.id}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {payment.studentName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
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
                          <td className="py-3 px-4 text-right font-mono font-semibold text-foreground" data-testid={`text-amount-${index}`}>
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getPaymentMethodBadge(payment.paymentMethod)} data-testid={`badge-method-${index}`}>
                              {payment.paymentMethod?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono text-muted-foreground" data-testid={`text-reference-${index}`}>
                            {payment.referenceNumber || '-'}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground" data-testid={`text-date-${index}`}>
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" data-testid={`button-view-payment-${payment.id}`}>
                                <i className="fas fa-eye text-primary"></i>
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-receipt-payment-${payment.id}`}>
                                <i className="fas fa-receipt text-accent"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            <TabsContent value="recent" className="mt-0">
              {!filteredPayments || filteredPayments.length === 0 ? (
                <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <i className="fas fa-credit-card text-4xl text-muted-foreground mb-3"></i>
                    <p className="text-muted-foreground">No recent payments found</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Class</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Method</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Reference</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment: any, index: number) => (
                        <tr key={payment.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-payment-${payment.id}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {payment.studentName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
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
                          <td className="py-3 px-4 text-right font-mono font-semibold text-foreground" data-testid={`text-amount-${index}`}>
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getPaymentMethodBadge(payment.paymentMethod)} data-testid={`badge-method-${index}`}>
                              {payment.paymentMethod?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono text-muted-foreground" data-testid={`text-reference-${index}`}>
                            {payment.referenceNumber || '-'}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground" data-testid={`text-date-${index}`}>
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusBadge(payment.status)} data-testid={`badge-status-${index}`}>
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {payment.status === 'pending' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleVerifyPayment(payment.id)}
                                  disabled={verifyMutation.isPending}
                                  data-testid={`button-verify-payment-${payment.id}`}
                                >
                                  <i className="fas fa-check text-secondary"></i>
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" data-testid={`button-view-payment-${payment.id}`}>
                                <i className="fas fa-eye text-primary"></i>
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-edit-payment-${payment.id}`}>
                                <i className="fas fa-edit text-muted-foreground"></i>
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-receipt-payment-${payment.id}`}>
                                <i className="fas fa-receipt text-accent"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <PaymentForm 
        isOpen={isPaymentFormOpen}
        onClose={() => setIsPaymentFormOpen(false)}
      />
    </div>
  );
}
