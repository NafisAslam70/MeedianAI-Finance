import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useFinancePeriod } from "@/context/FinancePeriodContext";
import type {
  Class,
  Student,
  StudentFinanceSummary,
  StudentFinanceDue,
  RecordPaymentPayload,
  RecordPaymentResponse,
} from "@/lib/types";
import { Check, ChevronsUpDown, CircleDollarSign, Printer, Receipt, X } from "lucide-react";

const paymentMethodOptions = [
  "cash",
  "upi",
  "bank_transfer",
  "bank",
  "cheque",
  "online",
] as const;

type PaymentMethodOption = (typeof paymentMethodOptions)[number];

const paymentMethodLabels: Record<PaymentMethodOption, string> = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  bank: "Bank (Counter)",
  cheque: "Cheque",
  online: "Online Portal",
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number | string): string => {
  const numeric = typeof value === "string" ? parseFloat(value) : value;
  if (!Number.isFinite(numeric)) {
    return currencyFormatter.format(0);
  }
  return currencyFormatter.format(numeric);
};

const statusClassMap: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  partial: "bg-amber-100 text-amber-700 border border-amber-200",
  due: "bg-red-100 text-red-700 border border-red-200",
};

const toTitleCase = (value?: string | null) => {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const paymentSchema = z.object({
  studentId: z.coerce.number().int().positive({ message: "Select a student" }),
  paymentMethod: z.enum(paymentMethodOptions, { message: "Choose a payment method" }),
  paymentDate: z.string().min(1, "Payment date is required"),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type DueAllocationState = Record<number, { due: StudentFinanceDue; amount: number }>;

type CustomCharge = {
  id: string;
  label: string;
  category: string;
  amount: number;
  notes?: string;
};

type AllocationDisplayItem = {
  key: string;
  label: string;
  amount: number;
  type: "due" | "other";
  status?: string;
  notes?: string | null;
};

const createDefaultFormValues = (): Partial<PaymentFormValues> => ({
  paymentMethod: "cash",
  paymentDate: new Date().toISOString().split("T")[0],
  referenceNumber: "",
  remarks: "",
});

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentForm({ isOpen, onClose }: PaymentFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: createDefaultFormValues(),
  });

  const [activeStudentId, setActiveStudentId] = useState<number | undefined>();
  const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("oneTime");
  const [dueAllocations, setDueAllocations] = useState<DueAllocationState>({});
  const [customCharges, setCustomCharges] = useState<CustomCharge[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<RecordPaymentPayload | null>(null);
  const [pendingStudent, setPendingStudent] = useState<Student | undefined>(undefined);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const { year: activeAcademicYear } = useFinancePeriod();

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const classMap = useMemo(() => {
    const map = new Map<number, Class>();
    if (Array.isArray(classes)) {
      classes.forEach((cls) => {
        map.set(cls.id, cls);
      });
    }
    return map;
  }, [classes]);

  const sortedStudents = useMemo(() => {
    if (!students?.length) return [] as Student[];
    return [...students].sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const getClassLabel = (student?: Student) => {
    if (!student) return "No class assigned";
    const cls = classMap.get(student.classId) ?? student.class ?? null;
    if (!cls || !cls.name) {
      return "No class assigned";
    }
    const baseName = cls.name.toLowerCase().startsWith("class") ? cls.name : `Class ${cls.name}`;
    const section = cls.section ? ` - ${cls.section}` : "";
    return `${baseName}${section}`;
  };

  const getStudentTypeLabel = (student?: Student) => {
    if (!student) return "";
    return student.isHosteller ? "Hosteller" : "Day Scholar";
  };

  const getClassAndTypeLabel = (student?: Student) => {
    const classLabel = getClassLabel(student);
    const typeLabel = getStudentTypeLabel(student);
    if (!typeLabel) {
      return classLabel;
    }
    return `${classLabel}${classLabel ? " • " : ""}${typeLabel}`;
  };

  const selectedStudent = useMemo(() => {
    if (!activeStudentId) return undefined;
    return sortedStudents.find((student) => student.id === activeStudentId);
  }, [sortedStudents, activeStudentId]);

  const financeQueryKey = ["student-finance", activeStudentId ?? "idle"] as const;

  const {
    data: financeSummary,
    isFetching: financeSummaryLoading,
    isError: financeSummaryError,
    error: financeSummaryErrorObject,
    refetch: refetchFinanceSummary,
  } = useQuery<StudentFinanceSummary | null>({
    queryKey: financeQueryKey,
    enabled: Boolean(activeStudentId),
    staleTime: 0,
    retry: false,
    queryFn: async ({ queryKey }) => {
      const [, studentId] = queryKey as ["student-finance", number];
      const res = await fetch(`/api/students/${studentId}/finance`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Unable to load dues (status ${res.status})`);
      }
      return res.json();
    },
  });

  useEffect(() => {
    if (!activeStudentId) {
      return;
    }
    if (financeSummaryError && financeSummaryErrorObject) {
      const description = financeSummaryErrorObject instanceof Error
        ? financeSummaryErrorObject.message
        : "Unable to load dues for the selected student.";

      toast({
        title: "Could not load dues",
        description,
        variant: "destructive",
      });
    }
  }, [activeStudentId, financeSummaryError, financeSummaryErrorObject, toast]);

  useEffect(() => {
    if (!financeSummary) return;
    if (Object.keys(dueAllocations).length > 0) return;

    const hasOneTime = financeSummary.buckets.oneTime.some((due) => due.balance > 0.01);
    const hasMonthly = financeSummary.buckets.monthly.some((due) => due.balance > 0.01);
    if (hasOneTime) {
      setActiveTab("oneTime");
    } else if (hasMonthly) {
      setActiveTab("monthly");
    } else if (financeSummary.buckets.misc.length) {
      setActiveTab("misc");
    } else {
      setActiveTab("oneTime");
    }
  }, [financeSummary, dueAllocations]);

  useEffect(() => {
    if (!isOpen) {
      setActiveStudentId(undefined);
      form.reset({ studentId: undefined as unknown as number, ...createDefaultFormValues() });
      setDueAllocations({});
      setCustomCharges([]);
      setActiveTab("oneTime");
      setStudentPopoverOpen(false);
    }
  }, [isOpen, form]);

  const handleSelectStudent = (studentId: number) => {
    setActiveStudentId(studentId);
    form.setValue("studentId", studentId, { shouldDirty: true, shouldValidate: true });
    setStudentPopoverOpen(false);
    setDueAllocations({});
    setCustomCharges([]);
    setActiveTab("oneTime");
  };

  const toggleDueSelection = (due: StudentFinanceDue) => {
    setDueAllocations((current) => {
      if (current[due.id]) {
        const { [due.id]: _removed, ...rest } = current;
        return rest;
      }
      const balance = Math.max(0, Number(due.balance ?? 0));
      if (balance <= 0) {
        return current;
      }
      return {
        ...current,
        [due.id]: { due, amount: balance },
      };
    });
  };

  const updateDueAmount = (due: StudentFinanceDue, amount: number) => {
    const safeAmount = Math.max(0, Math.min(amount, Math.max(0, Number(due.balance ?? 0))));
    setDueAllocations((current) => {
      if (!current[due.id]) {
        if (safeAmount <= 0) return current;
        return {
          ...current,
          [due.id]: { due, amount: safeAmount },
        };
      }
      if (safeAmount <= 0) {
        const { [due.id]: _removed, ...rest } = current;
        return rest;
      }
      return {
        ...current,
        [due.id]: { due, amount: safeAmount },
      };
    });
  };

  const addCustomCharge = () => {
    setCustomCharges((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        label: "",
        category: "",
        amount: 0,
        notes: "",
      },
    ]);
  };

  const updateCustomCharge = (id: string, updates: Partial<CustomCharge>) => {
    setCustomCharges((prev) =>
      prev.map((charge) => (charge.id === id ? { ...charge, ...updates } : charge)),
    );
  };

  const removeCustomCharge = (id: string) => {
    setCustomCharges((prev) => prev.filter((charge) => charge.id !== id));
  };

  const allocationEntries: AllocationDisplayItem[] = useMemo(() => {
    const dueEntries = Object.values(dueAllocations).map((entry) => ({
      key: `due-${entry.due.id}`,
      label: entry.due.label,
      amount: Number(entry.amount ?? 0),
      type: "due" as const,
      status: entry.due.status,
      notes: entry.due.notes,
    }));

    const customEntries = customCharges
      .filter((charge) => charge.amount > 0 && ((charge.label ?? "").trim() || (charge.category ?? "").trim()))
      .map((charge) => ({
        key: charge.id,
        label: (charge.label || charge.category || "Other Fee").trim(),
        amount: Number(charge.amount ?? 0),
        type: "other" as const,
        notes: charge.notes?.trim(),
      }));

    return [...dueEntries, ...customEntries];
  }, [customCharges, dueAllocations]);

  const totalAmount = useMemo(
    () => allocationEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0),
    [allocationEntries],
  );

  const { mutateAsync: recordPayment, isPending: recording } = useMutation<
    RecordPaymentResponse,
    Error,
    RecordPaymentPayload
  >({
    mutationFn: async (payload) => {
      const response = await apiRequest("POST", "/api/payments/record", payload);
      return response.json();
    },
  });

  const resetConfirmation = () => {
    setConfirmDialogOpen(false);
    setPendingPayload(null);
    setPendingStudent(undefined);
    setPendingAmount(0);
  };

  const openReceiptWindow = (data: RecordPaymentResponse, student?: Student) => {
    if (typeof window === "undefined") return;
    const receiptWindow = window.open("", "_blank", "width=720,height=900");
    if (!receiptWindow) return;

    const paymentDate = data.payment.paymentDate
      ? new Date(data.payment.paymentDate).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

    const reference = data.payment.transactionId ?? data.payment.referenceNumber ?? "N/A";

    const classLabel = getClassLabel(student);
    const formattedClassLabel = classLabel === "No class assigned" ? "" : classLabel;
    const typeLabel = getStudentTypeLabel(student);
    const guardianLine = student?.guardianName ? `Parent: ${student.guardianName}` : "";

    const studentDetailsHtml = [
      student?.name ?? "",
      formattedClassLabel,
      typeLabel,
      student?.admissionNumber ? `Admission #${student.admissionNumber}` : "",
      guardianLine,
    ]
      .filter(Boolean)
      .map((line) => `<div>${line}</div>`)
      .join("");

    const allocationRows = data.allocations
      .map(
        (allocation, index) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${index + 1}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${allocation.label ?? "Fee"}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(allocation.amount)}</td>
          </tr>
        `,
      )
      .join("");

    const receiptHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Meed Public School - Payment Receipt #${data.payment.id}</title>
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
      <div class="muted">Receipt #: ${data.payment.id} - Generated on ${new Date().toLocaleString("en-IN")}</div>
    </div>

    <div class="section">
      <h2 style="font-size:16px;margin-bottom:4px;">Student Details</h2>
      <div class="muted">${studentDetailsHtml}</div>
    </div>

    <div class="section">
      <h2 style="font-size:16px;margin-bottom:4px;">Payment Information</h2>
      <div class="muted">
        <div>Amount Paid: <strong>${formatCurrency(data.payment.amount)}</strong></div>
        <div>Payment Method: ${toTitleCase(data.payment.paymentMethod)}</div>
        <div>Payment Date: ${paymentDate}</div>
        <div>Reference: ${reference}</div>
        <div>Remarks: ${data.payment.remarks ?? "N/A"}</div>
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
      <div class="total">Total Paid: ${formatCurrency(data.payment.amount)}</div>
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

  const handleConfirmPayment = async () => {
    if (!pendingPayload || !pendingStudent) {
      resetConfirmation();
      return;
    }

    try {
      const data = await recordPayment(pendingPayload);

      toast({
        title: "Payment recorded",
        description: `Receipt #${data.payment.id} generated successfully.`,
      });

      openReceiptWindow(data, pendingStudent);

      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dues"] });
      queryClient.invalidateQueries({ queryKey: ["student-finance", pendingStudent.id] });

      setActiveStudentId(undefined);
      form.reset({ studentId: undefined as unknown as number, ...createDefaultFormValues() });
      setDueAllocations({});
      setCustomCharges([]);
      setActiveTab("oneTime");
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to record payment",
        description: error?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      resetConfirmation();
    }
  };

  const submitPayment = async (values: PaymentFormValues) => {
    if (!activeStudentId || !selectedStudent) {
      toast({
        title: "Select a student",
        description: "Choose a student before recording a payment.",
        variant: "destructive",
      });
      return;
    }

    if (!allocationEntries.length || totalAmount <= 0) {
      toast({
        title: "Add fee components",
        description: "Select at least one fee and enter a valid amount before continuing.",
        variant: "destructive",
      });
      return;
    }

    const payload: RecordPaymentPayload = {
      studentId: values.studentId,
      paymentDate: values.paymentDate,
      paymentMethod: values.paymentMethod,
      referenceNumber: values.referenceNumber?.trim() || undefined,
      remarks: values.remarks?.trim() || undefined,
      allocations: [
        ...Object.values(dueAllocations).map((entry) => ({
          dueId: entry.due.id,
          amount: Math.round(entry.amount * 100) / 100,
        })),
        ...customCharges
          .filter((charge) => charge.amount > 0 && ((charge.label ?? "").trim() || (charge.category ?? "").trim()))
          .map((charge) => ({
            amount: Math.round(charge.amount * 100) / 100,
            label: charge.label?.trim() || undefined,
            category: charge.category?.trim() || undefined,
            notes: charge.notes?.trim() || undefined,
          })),
      ],
      academicYear: activeAcademicYear,
      verify: true,
      createdBy: 1,
    };

    const totalRecordedAmount = payload.allocations.reduce((sum, item) => sum + (item.amount || 0), 0);
    if (!payload.allocations.length || totalRecordedAmount <= 0) {
      toast({
        title: "Enter valid amounts",
        description: "Allocation amounts must add up to more than zero.",
        variant: "destructive",
      });
      return;
    }

    setPendingPayload(payload);
    setPendingStudent(selectedStudent);
    setPendingAmount(totalRecordedAmount);
    setConfirmDialogOpen(true);
  };

  const renderDueCard = (due: StudentFinanceDue) => {
    const balance = Math.max(0, Number(due.balance ?? 0));
    const isSelected = Boolean(dueAllocations[due.id]);
    const disabled = balance <= 0.01;
    const selectedAmount = dueAllocations[due.id]?.amount ?? balance;

    return (
      <div
        key={due.id}
        role="button"
        tabIndex={0}
        onClick={() => (!disabled ? toggleDueSelection(due) : undefined)}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !disabled) {
            event.preventDefault();
            toggleDueSelection(due);
          }
        }}
        className={cn(
          "rounded-lg border bg-background p-4 transition-all",
          "hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
          disabled && "opacity-60 cursor-not-allowed",
          isSelected && "border-primary bg-primary/5 shadow-sm",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{due.label}</p>
            {due.notes ? (
              <p className="mt-1 text-xs text-muted-foreground">{due.notes}</p>
            ) : null}
          </div>
          <Badge className={cn("capitalize", statusClassMap[due.status] ?? "bg-muted text-muted-foreground border")}>{due.status}</Badge>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div>
            <span className="block text-[11px] uppercase tracking-wide">Amount</span>
            <span className="font-semibold text-foreground">{formatCurrency(due.amount)}</span>
          </div>
          <div>
            <span className="block text-[11px] uppercase tracking-wide">Paid</span>
            <span className="font-semibold text-foreground">{formatCurrency(due.paidAmount)}</span>
          </div>
          <div>
            <span className="block text-[11px] uppercase tracking-wide">Balance</span>
            <span className="font-semibold text-foreground">{formatCurrency(balance)}</span>
          </div>
        </div>
        {isSelected && !disabled ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                updateDueAmount(due, balance);
              }}
            >
              Pay In Full
            </Button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Amount</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                max={balance}
                value={selectedAmount}
                onChange={(event) => updateDueAmount(due, parseFloat(event.target.value) || 0)}
                onClick={(event) => event.stopPropagation()}
                className="h-8 w-28"
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const buckets = financeSummary?.buckets ?? { oneTime: [], monthly: [], misc: [] };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[min(96vw,900px)] max-h-[90vh] overflow-hidden p-0 sm:p-6">
        <DialogHeader className="px-6 pt-6 sm:px-0 sm:pt-0">
          <DialogTitle data-testid="text-payment-form-title" className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Record Payment
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(90vh-6rem)] overflow-y-auto px-6 pb-6 sm:px-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submitPayment)} className="space-y-6">
              <div className="space-y-6">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Choose Student</FormLabel>
                    <FormControl>
                      <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {selectedStudent ? (
                              <div className="flex flex-col items-start text-left">
                                <span className="font-medium text-foreground">{selectedStudent.name}</span>
                                <span className="text-xs text-muted-foreground">{getClassAndTypeLabel(selectedStudent)}</span>
                                <span className="text-[11px] text-muted-foreground">
                                  {selectedStudent.admissionNumber
                                    ? `Adm. #${selectedStudent.admissionNumber}`
                                    : "No admission #"}
                                  {selectedStudent.guardianName ? ` • Parent: ${selectedStudent.guardianName}` : ""}
                                </span>
                              </div>
                            ) : (
                              "Search student by name, admission number, or guardian"
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[420px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Start typing to search..." />
                            <CommandEmpty>No student found.</CommandEmpty>
                            <CommandGroup>
                              {sortedStudents.map((student) => (
                                <CommandItem
                                  key={student.id}
                                  value={`${student.name} ${student.admissionNumber ?? ""} ${student.guardianName ?? ""} ${getClassLabel(student)} ${getStudentTypeLabel(student)}`}
                                  onSelect={() => handleSelectStudent(student.id)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      activeStudentId === student.id ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">{getClassAndTypeLabel(student)}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {student.admissionNumber
                                        ? `Adm. #${student.admissionNumber}`
                                        : "No admission #"}
                                      {student.guardianName ? ` • Parent: ${student.guardianName}` : ""}
                                    </p>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedStudent && (
                <div className="rounded-xl border bg-muted/40 p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CircleDollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{selectedStudent.name}</p>
                          <Badge
                            variant={selectedStudent.isHosteller ? "secondary" : "outline"}
                            className="text-[10px] font-semibold uppercase tracking-wide"
                          >
                            {getStudentTypeLabel(selectedStudent)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{getClassLabel(selectedStudent)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="block text-[11px] uppercase tracking-wide">Outstanding</span>
                        <span className="text-sm font-semibold text-destructive">
                          {formatCurrency(financeSummary?.totals.outstanding ?? 0)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] uppercase tracking-wide">Partial Dues</span>
                        <span className="text-sm font-semibold text-foreground">
                          {financeSummary?.totals.partialCount ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] uppercase tracking-wide">Due Items</span>
                        <span className="text-sm font-semibold text-foreground">
                          {financeSummary?.totals.dueCount ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Fee Components</h3>
                  {financeSummaryLoading && (
                    <span className="text-xs text-muted-foreground">Loading fee status...</span>
                  )}
                </div>
                {activeStudentId ? (
                  financeSummaryError ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      <p className="mb-3 text-destructive">Could not load dues for this student.</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => refetchFinanceSummary()}>
                        Try again
                      </Button>
                    </div>
                  ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList>
                        <TabsTrigger value="oneTime">One-Time</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger value="misc">Other Fees</TabsTrigger>
                      </TabsList>
                      <TabsContent value="oneTime" className="mt-4">
                        {financeSummaryLoading ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                              <Skeleton key={index} className="h-28 w-full" />
                            ))}
                          </div>
                        ) : buckets.oneTime.length ? (
                          <div className="max-h-80 overflow-y-auto pr-2">
                            <div className="grid gap-3 md:grid-cols-2">
                              {buckets.oneTime.map(renderDueCard)}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                            No one-time fee pending for this student.
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="monthly" className="mt-4">
                        {financeSummaryLoading ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            {Array.from({ length: 6 }).map((_, index) => (
                              <Skeleton key={index} className="h-28 w-full" />
                            ))}
                          </div>
                        ) : buckets.monthly.length ? (
                          <div className="max-h-80 overflow-y-auto pr-2">
                            <div className="grid gap-3 md:grid-cols-2">
                              {buckets.monthly.map(renderDueCard)}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                            Monthly fees are clear for this academic year.
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="misc" className="mt-4 space-y-4">
                        {financeSummaryLoading ? (
                          <Skeleton className="h-28 w-full" />
                        ) : buckets.misc.length ? (
                          <div className="space-y-3">
                            {buckets.misc.map(renderDueCard)}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                            No other outstanding fees found.
                          </div>
                        )}
                        <div className="rounded-lg border bg-muted/20 p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground">Add Other Fee</h4>
                            <Button type="button" variant="ghost" size="sm" onClick={addCustomCharge}>
                              + Add Charge
                            </Button>
                          </div>
                          {customCharges.length === 0 ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Use this to record uniforms, exam supplies, or any ad-hoc fee with notes.
                            </p>
                          ) : null}
                          <div className="mt-3 space-y-3">
                            {customCharges.map((charge) => (
                              <div key={charge.id} className="grid gap-3 rounded-lg border bg-background p-3 md:grid-cols-[1.2fr_1fr_120px_auto]">
                                <Input
                                  placeholder="Fee label"
                                  value={charge.label}
                                  onChange={(event) => updateCustomCharge(charge.id, { label: event.target.value })}
                                  className="h-9"
                                />
                                <Input
                                  placeholder="Category"
                                  value={charge.category}
                                  onChange={(event) => updateCustomCharge(charge.id, { category: event.target.value })}
                                  className="h-9"
                                />
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  placeholder="Amount"
                                  value={charge.amount || ""}
                                  onChange={(event) =>
                                    updateCustomCharge(charge.id, { amount: parseFloat(event.target.value) || 0 })
                                  }
                                  className="h-9"
                                />
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="Notes"
                                    value={charge.notes || ""}
                                    onChange={(event) => updateCustomCharge(charge.id, { notes: event.target.value })}
                                    className="h-9"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeCustomCharge(charge.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  )
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Select a student to view fee buckets and outstanding dues.
                  </div>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Payment Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethodOptions.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {paymentMethodLabels[method]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Date</FormLabel>
                          <FormControl>
                            <Input type="date" max={new Date().toISOString().split("T")[0]} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="referenceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Transaction ID / Cheque number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Remarks</FormLabel>
                          <FormControl>
                            <Textarea rows={3} placeholder="Optional note for this payment" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Payment Summary</h3>
                    <Badge variant="secondary" className="text-sm font-semibold">
                      Total: {formatCurrency(totalAmount)}
                    </Badge>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    {allocationEntries.length ? (
                      <div className="space-y-3">
                        {allocationEntries.map((entry) => (
                          <div key={entry.key} className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {entry.label}
                                {entry.type === "other" ? " (Other)" : ""}
                              </p>
                              {entry.notes ? (
                                <p className="text-xs text-muted-foreground">{entry.notes}</p>
                              ) : null}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">{formatCurrency(entry.amount)}</p>
                              {entry.status ? (
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{entry.status}</p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Select fee components or add other charges to build this payment.
                      </p>
                    )}
                  </div>
                  {selectedStudent && financeSummary ? (
                    <div className="rounded-lg border bg-background p-4 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">Post-payment outlook</p>
                      <p className="mt-1">
                        Outstanding after payment will update automatically once the receipt is generated.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col justify-end gap-2 border-t pt-4 sm:flex-row">
                <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-payment">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-testid="button-save-payment"
                  disabled={recording || !activeStudentId || totalAmount <= 0}
                >
                  {recording ? (
                    "Recording..."
                  ) : (
                    <span className="flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      Pay &amp; Generate Receipt
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>
          </Form>
        </div>
      </DialogContent>
      <AlertDialog
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (recording) return;
            resetConfirmation();
          } else {
            setConfirmDialogOpen(true);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm payment</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStudent
                ? `Record ${formatCurrency(pendingAmount)} for ${pendingStudent.name}?`
                : `Record ${formatCurrency(pendingAmount)} for the selected student?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
            <div>Components: {pendingPayload?.allocations.length ?? 0}</div>
            <div>Payment method: {toTitleCase(pendingPayload?.paymentMethod)}</div>
            {pendingPayload?.remarks ? <div>Remarks: {pendingPayload.remarks}</div> : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={recording}
              onClick={(event) => {
                if (recording) {
                  event.preventDefault();
                  return;
                }
                resetConfirmation();
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={recording}
              onClick={(event) => {
                event.preventDefault();
                if (!recording) {
                  void handleConfirmPayment();
                }
              }}
            >
              {recording ? "Recording..." : "Confirm Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
