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
import { cn } from "@/lib/utils";
import { useFinancePeriod } from "@/context/FinancePeriodContext";
import type { RecordPaymentResponse } from "@/lib/types";

type PaymentReceiptStudent = {
  id: number;
  name: string;
  admissionNumber?: string | null;
  guardianName?: string | null;
  isHosteller?: boolean | null;
  className?: string | null;
  classSection?: string | null;
};

type PaymentReceiptResponse = RecordPaymentResponse & {
  student?: PaymentReceiptStudent;
};

export default function Payments() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [receiptLoadingId, setReceiptLoadingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { year: activeAcademicYear } = useFinancePeriod();

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments", activeAcademicYear],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/payments?academicYear=${encodeURIComponent(activeAcademicYear)}`,
      );
      return response.json();
    },
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

  const toTitleCase = (value?: string | null) => {
    if (!value) return "";
    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (match) => match.toUpperCase());
  };

  const getClassLabel = (student?: PaymentReceiptStudent) => {
    if (!student?.className) {
      return "No class assigned";
    }
    const base = student.className.toLowerCase().startsWith("class")
      ? student.className
      : `Class ${student.className}`;
    const section = student.classSection ? ` - ${student.classSection}` : "";
    return `${base}${section}`;
  };

  const getStudentTypeLabel = (student?: PaymentReceiptStudent) => {
    if (!student) return "";
    return student.isHosteller ? "Hosteller" : "Day Scholar";
  };

  const openReceiptWindow = (receipt: PaymentReceiptResponse) => {
    if (typeof window === "undefined") return;

    const receiptWindow = window.open("", "_blank", "width=720,height=900");
    if (!receiptWindow) return;

    const payment = receipt.payment;
    const student = receipt.student;
    const paymentDate = payment.paymentDate
      ? new Date(payment.paymentDate).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

    const reference = (payment as any).referenceNumber ?? payment.transactionId ?? "N/A";

    const classLabel = getClassLabel(student);
    const typeLabel = getStudentTypeLabel(student);
    const guardianLine = student?.guardianName ? `Parent: ${student.guardianName}` : "";

    const fallbackStudentLines = [
      (payment as any).studentName ?? "",
      (payment as any).className ?? "",
    ]
      .filter(Boolean)
      .map((line: string) => `<div>${line}</div>`) 
      .join("");

    const studentDetailsHtml = student
      ? [
          student.name,
          classLabel,
          typeLabel,
          student.admissionNumber ? `Admission #${student.admissionNumber}` : "",
          guardianLine,
        ]
          .filter(Boolean)
          .map((line) => `<div>${line}</div>`)
          .join("") || fallbackStudentLines
      : fallbackStudentLines || '<div>Student information unavailable</div>';

    const allocationRows = receipt.allocations.length
      ? receipt.allocations
          .map(
            (allocation, index) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${index + 1}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${allocation.label ?? allocation.category ?? "Fee"}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(allocation.amount)}</td>
          </tr>
        `,
          )
          .join("")
      : `<tr><td colspan="3" style="padding:12px;text-align:center;color:#6b7280;">No fee components recorded for this payment.</td></tr>`;

    const receiptHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Meed Public School - Payment Receipt #${payment.id}</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 24px; color: #111827; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      .muted { color: #6b7280; font-size: 12px; }
      .section { margin-top: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { text-align: left; padding: 8px; border-bottom: 1px solid #d1d5db; background: #f9fafb; font-size: 12px; }
      td { font-size: 13px; }
      .total { font-size: 16px; font-weight: 600; text-align: right; padding-top: 16px; }
      .stamp { border: 2px solid #1f2937; padding: 16px 32px; border-radius: 12px; display: inline-block; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
      .stamp span { display: block; font-size: 12px; font-weight: 400; margin-top: 4px; letter-spacing: normal; }
    </style>
  </head>
  <body>
    <div>
      <h1>Meed Public School - Payment Receipt</h1>
      <div class="muted">Receipt #: ${payment.id} - Generated on ${new Date().toLocaleString("en-IN")}</div>
    </div>

    <div class="section">
      <h2 style="font-size:16px;margin-bottom:4px;">Student Details</h2>
      <div class="muted">${studentDetailsHtml}</div>
    </div>

    <div class="section">
      <h2 style="font-size:16px;margin-bottom:4px;">Payment Information</h2>
      <div class="muted">
        <div>Amount Paid: <strong>${formatCurrency(payment.amount)}</strong></div>
        <div>Payment Method: ${toTitleCase(payment.paymentMethod)}</div>
        <div>Payment Date: ${paymentDate}</div>
        <div>Reference: ${reference}</div>
        <div>Remarks: ${payment.remarks ?? "N/A"}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:60px;text-align:center;">S/N</th>
            <th>Fee Component</th>
            <th style="text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${allocationRows}
        </tbody>
      </table>
      <div class="total">Total Paid: ${formatCurrency(payment.amount)}</div>
    </div>

    <div class="section" style="display:flex;justify-content:flex-end;">
      <div class="stamp">
        Meed Public School
        <span>Authorised Stamp</span>
      </div>
    </div>
  </body>
</html>`;

    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
    receiptWindow.focus();
    setTimeout(() => {
      receiptWindow.print();
      receiptWindow.close();
    }, 400);
  };

  const openReceipt = async (paymentRow: any) => {
    const paymentId = paymentRow?.id;
    if (!paymentId) {
      toast({ title: "Unable to open receipt", description: "Missing payment identifier." });
      return;
    }

    try {
      setReceiptLoadingId(paymentId);
      const response = await fetch(`/api/payments/${paymentId}/receipt`, {
        credentials: "include",
      });
      const rawBody = await response.text();

      if (!response.ok) {
        const message = rawBody || `Unable to load receipt (status ${response.status})`;
        throw new Error(message);
      }

      const data: PaymentReceiptResponse = JSON.parse(rawBody);
      openReceiptWindow(data);
    } catch (error: any) {
      const message = error?.message || "Unable to load full receipt.";
      toast({
        title: "Showing summary receipt",
        description: `${message} Displaying a simplified receipt instead.`,
      });

      const amountNumber = typeof paymentRow.amount === 'number'
        ? paymentRow.amount
        : parseFloat(paymentRow.amount ?? '0');

      const fallbackPayment = {
        id: paymentRow.id,
        studentId: paymentRow.studentId,
        studentFeeId: paymentRow.studentFeeId ?? undefined,
        amount: Number.isFinite(amountNumber) ? amountNumber.toFixed(2) : '0.00',
        paymentMethod: paymentRow.paymentMethod,
        paymentDate: paymentRow.paymentDate,
        transactionId: paymentRow.referenceNumber ?? undefined,
        referenceNumber: paymentRow.referenceNumber ?? undefined,
        remarks: paymentRow.remarks ?? undefined,
        status: paymentRow.status ?? 'pending',
        verifiedBy: paymentRow.verifiedBy ?? undefined,
        verifiedAt: paymentRow.verifiedAt ?? undefined,
        createdBy: paymentRow.createdBy ?? 1,
        createdAt: paymentRow.createdAt ?? new Date().toISOString(),
        receiptUrl: null,
      } as RecordPaymentResponse['payment'];

      const fallbackStudent: PaymentReceiptStudent | undefined = paymentRow.studentName
        ? {
            id: paymentRow.studentId,
            name: paymentRow.studentName,
            admissionNumber: paymentRow.studentAdmissionNumber ?? null,
            guardianName: paymentRow.studentGuardianName ?? null,
            isHosteller: paymentRow.studentIsHosteller ?? null,
            className: paymentRow.classRawName ?? paymentRow.className ?? null,
            classSection: paymentRow.classSection ?? null,
          }
        : undefined;

      openReceiptWindow({
        payment: fallbackPayment,
        allocations: [],
        student: fallbackStudent,
        summary: null,
      });
    } finally {
      setReceiptLoadingId(null);
    }
  };

  const renderPaymentRow = (payment: any, index: number) => {
    const isRowLoading = receiptLoadingId === payment.id;
    const initials = payment.studentName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || "--";

    return (
      <tr
        key={payment.id}
        className={cn(
          "border-b border-border hover:bg-muted/50 cursor-pointer transition",
          isRowLoading && "opacity-60 pointer-events-none"
        )}
        data-testid={`row-payment-${payment.id}`}
        onClick={() => openReceipt(payment)}
      >
        <td className="py-3 px-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {initials}
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
          <div className="flex flex-wrap items-center gap-2">
            {payment.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  handleVerifyPayment(payment.id);
                }}
                disabled={verifyMutation.isPending}
                data-testid={`button-verify-payment-${payment.id}`}
              >
                {verifyMutation.isPending ? 'Verifying…' : 'Verify'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                openReceipt(payment);
              }}
              disabled={isRowLoading}
              data-testid={`button-view-payment-${payment.id}`}
            >
              {isRowLoading ? 'Opening…' : 'View Receipt'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                toast({ title: 'Edit coming soon', description: 'Payment editing will be available shortly.' });
              }}
              data-testid={`button-edit-payment-${payment.id}`}
            >
              Edit
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  const filteredPayments = payments?.filter((payment: any) => {
    const matchesSearch = payment.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          payment.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;

    const hostellerValue = payment.studentIsHosteller;
    const isHosteller = hostellerValue === true
      || hostellerValue === 'true'
      || hostellerValue === 't'
      || hostellerValue === 1
      || hostellerValue === '1';
    const matchesTab = selectedTab === 'all'
      || (selectedTab === 'dayscholar' && !isHosteller)
      || (selectedTab === 'hosteller' && isHosteller)
      || (selectedTab === 'recent' && new Date(payment.paymentDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

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
                <TabsTrigger value="dayscholar" data-testid="tab-dayscholar">Day Scholars</TabsTrigger>
                <TabsTrigger value="hosteller" data-testid="tab-hosteller">Hostellers</TabsTrigger>
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
                      {filteredPayments.map((payment: any, index: number) => renderPaymentRow(payment, index))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            <TabsContent value="dayscholar" className="mt-0">
              {!filteredPayments || filteredPayments.length === 0 ? (
                <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <i className="fas fa-credit-card text-4xl text-muted-foreground mb-3"></i>
                    <p className="text-muted-foreground">No day scholar payments found</p>
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
                      {filteredPayments.map((payment: any, index: number) => renderPaymentRow(payment, index))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            <TabsContent value="hosteller" className="mt-0">
              {!filteredPayments || filteredPayments.length === 0 ? (
                <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <i className="fas fa-credit-card text-4xl text-muted-foreground mb-3"></i>
                    <p className="text-muted-foreground">No hosteller payments found</p>
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
                      {filteredPayments.map((payment: any, index: number) => renderPaymentRow(payment, index))}
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
                      {filteredPayments.map((payment: any, index: number) => renderPaymentRow(payment, index))}
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
