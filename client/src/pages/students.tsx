import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema, type InsertStudent } from "../../../shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { cn, buildAcademicYearMonths, getCurrentAcademicYear, getCurrentMonthKey } from "@/lib/utils";
import { useFinancePeriod } from "@/context/FinancePeriodContext";

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | "hosteller" | "dayscholar">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "left">("all");
  const [selectedAccountStatus, setSelectedAccountStatus] = useState<"all" | "open" | "closed" | "not-opened">("all");
  const [dueView, setDueView] = useState<"monthly" | "yearly" | "all">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<"all" | string>(() => getCurrentMonthKey());
  const [monthManuallyChosen, setMonthManuallyChosen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const { toast } = useToast();

  const { year: activeAcademicYear, years } = useFinancePeriod();

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/students", activeAcademicYear],
    queryFn: async ({ queryKey }) => {
      const [, academicYear] = queryKey as [string, string | undefined];
      const url = academicYear
        ? `/api/students?academicYear=${encodeURIComponent(academicYear)}`
        : `/api/students`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        const message = await response.text().catch(() => response.statusText);
        throw new Error(message || "Failed to load students");
      }
      return response.json();
    },
    enabled: !!activeAcademicYear,
  });

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
  });

  const openAccountMutation = useMutation({
    mutationFn: (studentId: number) => apiRequest('POST', `/api/students/${studentId}/open-account`, { academicYear: activeAcademicYear }),
    onSuccess: async (response) => {
      const payload = await response.json().catch(() => null);
      await queryClient.invalidateQueries({ queryKey: ['/api/students', activeAcademicYear] });
      const ledgerNumber = payload?.account?.ledgerNumber;
      const duesCreated = payload?.duesCreated ?? 0;
      toast({
        title: 'Account opened',
        description: ledgerNumber
          ? `Ledger ${ledgerNumber} created. Dues generated: ${duesCreated}.`
          : `Ledger created. Dues generated: ${duesCreated}.`,
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to open account', variant: 'destructive' });
    }
  });

  const createStudentMutation = useMutation({
    mutationFn: (data: InsertStudent) => apiRequest('POST', '/api/students', data),
    onSuccess: async (response) => {
      const created = await response.json().catch(() => null);
      await queryClient.invalidateQueries({ queryKey: ['/api/students', activeAcademicYear] });
      setIsDialogOpen(false);
      form.reset({
        name: "",
        admissionNumber: undefined,
        classId: 0,
        gender: undefined,
        guardianName: undefined,
        guardianPhone: undefined,
        address: undefined,
        isHosteller: false,
        transportChosen: false,
        feeStatus: "Pending",
        status: "active",
        academicYear: activeAcademicYear || getCurrentAcademicYear(),
      });
      toast({
        title: "Success",
        description: "Student added successfully",
      });
      if (created?.id && window.confirm('Student added. Open finance account now?')) {
        openAccountMutation.mutate(created.id as number);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: (payload: any) => apiRequest('PATCH', `/api/students/${payload.id}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students', activeAcademicYear] });
      setIsEditDialogOpen(false);
      toast({ title: 'Updated', description: 'Student updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update student', variant: 'destructive' });
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students', activeAcademicYear] });
      setIsDeleteOpen(false);
      toast({ title: 'Deleted', description: 'Student removed' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete student', variant: 'destructive' });
    }
  });


  const formSchema = insertStudentSchema.extend({
    classId: z.number().min(1, "Please select a class"),
    academicYear: z.string().min(1, "Please select an academic year"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      admissionNumber: undefined,
      classId: 0,
      isHosteller: false,
      transportChosen: false,
      guardianName: undefined,
      guardianPhone: undefined,
      gender: undefined,
      address: undefined,
      feeStatus: "Pending",
      status: "active",
      academicYear: activeAcademicYear || getCurrentAcademicYear(),
    },
  });

  useEffect(() => {
    if (activeAcademicYear) {
      form.setValue('academicYear', activeAcademicYear, { shouldValidate: false, shouldDirty: false });
    }
  }, [activeAcademicYear, form, isDialogOpen]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createStudentMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'bg-secondary/10 text-secondary',
      'inactive': 'bg-muted text-muted-foreground',
      'graduated': 'bg-primary/10 text-primary',
    };

    return variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  const getFeeStatusBadge = (status: string) => {
    const variants = {
      'Paid': 'bg-secondary/10 text-secondary',
      'Pending': 'bg-accent/10 text-accent',
      'Overdue': 'bg-destructive/10 text-destructive',
    };

    return variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  const getAccountStatusMeta = (student: any) => {
    if (!student.accountOpened) {
      return { label: 'Not opened', className: 'bg-muted text-muted-foreground' };
    }

    if (student.accountStatus === 'closed') {
      return { label: 'Closed', className: 'bg-muted text-muted-foreground' };
    }

    return { label: 'Open', className: 'bg-emerald-100 text-emerald-700' };
  };

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(students)) {
      (students as any[]).forEach((student: any) => {
        const breakdown = Array.isArray(student.monthlyDueBreakdown) ? student.monthlyDueBreakdown : [];
        if (breakdown.length) {
          breakdown.forEach((entry: any) => {
            if (entry?.dueMonth) {
              set.add(entry.dueMonth as string);
            }
          });
        } else if (student.accountAcademicYear) {
          buildAcademicYearMonths(student.accountAcademicYear).forEach((month) => set.add(month));
        } else if (student.academicYear) {
          buildAcademicYearMonths(student.academicYear).forEach((month) => set.add(month));
        }
      });
    }

    if (!set.size) {
      buildAcademicYearMonths(getCurrentAcademicYear()).forEach((month) => set.add(month));
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [students]);

  useEffect(() => {
    if (dueView !== 'monthly') {
      setSelectedMonth('all');
      setMonthManuallyChosen(false);
    }
  }, [dueView]);

  useEffect(() => {
    if (dueView !== 'monthly') {
      return;
    }

    const currentMonthKey = getCurrentMonthKey();

    if (!monthManuallyChosen) {
      if (availableMonths.includes(currentMonthKey)) {
        if (selectedMonth !== currentMonthKey) {
          setSelectedMonth(currentMonthKey);
        }
        return;
      }

      if (selectedMonth === 'all' || !availableMonths.includes(selectedMonth)) {
        const fallback = availableMonths[0] ?? currentMonthKey;
        if (selectedMonth !== fallback) {
          setSelectedMonth(fallback);
        }
      }
    } else if (selectedMonth !== 'all' && !availableMonths.includes(selectedMonth)) {
      const fallback = availableMonths[0] ?? 'all';
      if (selectedMonth !== fallback) {
        setSelectedMonth(fallback);
      }
    }
  }, [availableMonths, dueView, monthManuallyChosen, selectedMonth]);

  const getMonthlyPending = (student: any, month: string): number => {
    if (!month || month === 'all') {
      return Number(student.monthlyOutstanding ?? 0);
    }

    const breakdown = Array.isArray(student.monthlyDueBreakdown) ? student.monthlyDueBreakdown : [];
    if (!breakdown.length) {
      return Number(student.monthlyOutstanding ?? 0);
    }
    const entry = breakdown.find((item: any) => item?.dueMonth === month);
    return entry ? Number(entry.pending ?? 0) : 0;
  };

  const formatMonthLabel = (month: string) => {
    if (!month || month === 'all') {
      return 'All Months';
    }
    const [year, mm] = month.split('-');
    const date = new Date(Number(year), Number(mm) - 1);
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
  };

  const classMap = useMemo(() => {
    const map = new Map<number, string>();
    if (Array.isArray(classes)) {
      (classes as any[]).forEach((cls: any) => {
        map.set(cls.id, `${cls.name}${cls.section ? ` - ${cls.section}` : ''}`);
      });
    }
    return map;
  }, [classes]);

  const filteredStudents = useMemo(() => {
    const list = Array.isArray(students) ? (students as any[]) : [];
    const q = searchQuery.trim().toLowerCase();

    return list
      .filter((student) => {
        if (!activeAcademicYear) return true;
        const yearValue = student.academicYear || student.accountAcademicYear;
        return yearValue ? yearValue === activeAcademicYear : false;
      })
      .filter((student) => {
        if (!q) return true;
        return (
          student.name.toLowerCase().includes(q) ||
          (student.admissionNumber || "").toLowerCase().includes(q) ||
          (classMap.get(student.classId) || "").toLowerCase().includes(q)
        );
      })
      .filter((student) => {
        if (selectedClass === "all") return true;
        const cid = parseInt(selectedClass, 10);
        return student.classId === cid;
      })
      .filter((student) => {
        if (selectedType === "all") return true;
        return selectedType === "hosteller" ? !!student.isHosteller : !student.isHosteller;
      })
      .filter((student) => {
        if (selectedStatus === "all") return true;
        return (student.status || '').toLowerCase() === selectedStatus;
      })
      .filter((student) => {
        if (selectedAccountStatus === "all") return true;
        if (selectedAccountStatus === "not-opened") return !student.accountOpened;
        return (student.accountStatus || '').toLowerCase() === selectedAccountStatus;
      })
      .filter((student) => {
        if (dueView !== 'monthly' || selectedMonth === 'all') {
          return true;
        }
        return getMonthlyPending(student, selectedMonth) > 0;
      });
  }, [students, activeAcademicYear, searchQuery, classMap, selectedClass, selectedType, selectedStatus, selectedAccountStatus, dueView, selectedMonth]);

  if (!activeAcademicYear || studentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-[200px]">
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Student Management</h2>
          <p className="text-muted-foreground">Manage student records and fee information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-add-student">
              <i className="fas fa-plus mr-2"></i>
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Fill in the student information to add them to the system.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter student name" {...field} data-testid="input-student-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="admissionNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admission Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter admission number" {...field} data-testid="input-admission-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} data-testid="select-class">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(classes) && classes.map((cls: any) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name} {cls.section ? `- ${cls.section}` : ''}
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
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} data-testid="select-gender">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="academicYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} data-testid="select-academic-year">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select academic year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(years) && years.map((yearItem) => (
                              <SelectItem key={yearItem.code} value={yearItem.code}>
                                {yearItem.name || yearItem.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="guardianName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guardian Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter guardian name" {...field} data-testid="input-guardian-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guardianPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guardian Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter guardian phone" {...field} data-testid="input-guardian-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter student address" {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-6">
                  <FormField
                    control={form.control}
                    name="isHosteller"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-hosteller"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Hosteller</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transportChosen"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-transport"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Transport Required</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-student">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createStudentMutation.isPending} data-testid="button-submit-student">
                    {createStudentMutation.isPending ? 'Adding...' : 'Add Student'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="finance-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Students ({filteredStudents?.length || 0})</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="text"
                placeholder="Search by name or admission number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 md:w-72"
                data-testid="input-search-students"
              />
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-44" data-testid="select-filter-class">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {Array.isArray(classes) && (classes as any[]).map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
                <SelectTrigger className="w-40" data-testid="select-filter-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="hosteller">Hosteller</SelectItem>
                  <SelectItem value="dayscholar">Day Scholar</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as any)}>
                <SelectTrigger className="w-40" data-testid="select-filter-status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedAccountStatus} onValueChange={(v) => setSelectedAccountStatus(v as any)}>
                <SelectTrigger className="w-44" data-testid="select-filter-account">
                  <SelectValue placeholder="Account Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="not-opened">Not Opened</SelectItem>
                </SelectContent>
              </Select>
              <ToggleGroup
                type="single"
                value={dueView}
                onValueChange={(value) => value && setDueView(value as typeof dueView)}
                className="rounded-md border border-border"
                aria-label="Due view"
              >
                <ToggleGroupItem value="monthly" className="px-3 py-1 text-sm">Monthly</ToggleGroupItem>
                <ToggleGroupItem value="yearly" className="px-3 py-1 text-sm">Yearly</ToggleGroupItem>
                <ToggleGroupItem value="all" className="px-3 py-1 text-sm">All</ToggleGroupItem>
              </ToggleGroup>
              {dueView === 'monthly' && (
                <Select
                  value={selectedMonth}
                  onValueChange={(value) => {
                    setMonthManuallyChosen(true);
                    setSelectedMonth(value as typeof selectedMonth);
                  }}
                >
                  <SelectTrigger className="w-48" data-testid="select-filter-month">
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {availableMonths.map((month) => (
                      <SelectItem key={month} value={month}>{formatMonthLabel(month)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredStudents || filteredStudents.length === 0 ? (
            <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
              <div className="text-center">
                <i className="fas fa-users text-4xl text-muted-foreground mb-3"></i>
                <p className="text-muted-foreground">
                  {searchQuery ? 'No students found matching your search' : 'No students found'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="text-left py-2 px-3">Student</th>
                    <th className="text-left py-2 px-3">Adm No.</th>
                    <th className="text-left py-2 px-3">Class</th>
                    <th className="text-left py-2 px-3">Account</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Fee</th>
                    <th className="text-left py-2 px-3">
                      {dueView === 'monthly' ? 'Monthly Due' : dueView === 'yearly' ? 'One-Time Due' : 'Total Due'}
                    </th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student: any, index: number) => {
                    const accountMeta = getAccountStatusMeta(student);
                    const monthlyOutstanding = Number(student.monthlyOutstanding ?? 0);
                    const oneTimeOutstanding = Number(student.oneTimeOutstanding ?? 0);
                    const totalOutstanding = Number(student.totalOutstanding ?? 0);
                    const filteredMonthlyDue = dueView === 'monthly'
                      ? (selectedMonth === 'all'
                        ? monthlyOutstanding
                        : getMonthlyPending(student, selectedMonth))
                      : monthlyOutstanding;

                    const outstandingAmount = dueView === 'monthly'
                      ? filteredMonthlyDue
                      : dueView === 'yearly'
                        ? oneTimeOutstanding
                        : totalOutstanding;

                    const dueDetailLines: string[] = [];
                    if (dueView === 'monthly') {
                      if (selectedMonth === 'all') {
                        dueDetailLines.push(`Monthly total: ${formatCurrency(monthlyOutstanding)}`);
                      } else {
                        dueDetailLines.push(`${formatMonthLabel(selectedMonth)}: ${formatCurrency(filteredMonthlyDue)}`);
                        dueDetailLines.push(`All months: ${formatCurrency(monthlyOutstanding)}`);
                      }
                      dueDetailLines.push(`One-time: ${formatCurrency(oneTimeOutstanding)}`);
                    } else if (dueView === 'yearly') {
                      dueDetailLines.push(`One-time total: ${formatCurrency(oneTimeOutstanding)}`);
                      dueDetailLines.push(`Monthly: ${formatCurrency(monthlyOutstanding)}`);
                    } else {
                      dueDetailLines.push(`Monthly: ${formatCurrency(monthlyOutstanding)} · One-time: ${formatCurrency(oneTimeOutstanding)}`);
                    }
                    const accountMutatingId = openAccountMutation.variables as number | undefined;
                    const isOpeningAccount = openAccountMutation.isPending && accountMutatingId === student.id;
                    const classLabel = classMap.get(student.classId) || '-';

                    return (
                    <tr key={student.id} className="border-b border-border hover:bg-muted/40 text-sm" data-testid={`row-student-${student.id}`}>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {student.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm" data-testid={`text-student-name-${index}`}>
                              {student.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student.guardianName && `Guardian: ${student.guardianName}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono text-foreground" data-testid={`text-admission-number-${index}`}>
                        {student.admissionNumber || '-'}
                      </td>
                      <td className="py-2 px-3 text-foreground" data-testid={`text-class-${index}`}>
                        {classLabel}
                      </td>
                      <td className="py-2 px-3 text-foreground" data-testid={`text-account-${index}`}>
                        <div className="flex flex-col space-y-1">
                          <span className="font-mono text-xs">{student.ledgerNumber || '—'}</span>
                          <Badge className={cn('px-2 py-0.5 text-[10px] font-medium', accountMeta.className)}>{accountMeta.label}</Badge>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <Badge className={cn('px-2 py-0.5 text-[10px] font-medium', student.isHosteller ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground')}>
                          {student.isHosteller ? 'Hosteller' : 'Day Scholar'}
                        </Badge>
                        {student.transportChosen && (
                          <Badge className="ml-1 px-2 py-0.5 text-[10px] bg-purple-100 text-purple-600">Transport</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <Badge className={cn('px-2 py-0.5 text-[10px] font-medium', getFeeStatusBadge(student.feeStatus))} data-testid={`badge-fee-status-${index}`}>
                          {student.feeStatus}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 font-medium text-foreground" data-testid={`text-outstanding-${index}`}>
                        <div className="flex flex-col">
                          <span>{formatCurrency(outstandingAmount)}</span>
                          {dueDetailLines.map((line, lineIndex) => (
                            <span key={lineIndex} className="text-xs text-muted-foreground">{line}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <Badge className={cn('px-2 py-0.5 text-[10px] font-medium', getStatusBadge(student.status))} data-testid={`badge-status-${index}`}>
                          {student.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          {!student.accountOpened && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              title="Open account"
                              aria-label="Open account"
                              data-testid={`button-open-account-${student.id}`}
                              onClick={() => openAccountMutation.mutate(student.id)}
                              disabled={isOpeningAccount}
                            >
                              {isOpeningAccount ? <i className="fas fa-spinner fa-spin" /> : 'Open'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            title="Edit"
                            aria-label="Edit"
                            data-testid={`button-edit-student-${student.id}`}
                            onClick={() => { setSelectedStudent(student); setIsEditDialogOpen(true); }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            title="Move to left"
                            aria-label="Move to left"
                            data-testid={`button-delete-student-${student.id}`}
                            onClick={() => { setSelectedStudent(student); setIsDeleteOpen(true); }}
                          >
                            Left
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            title="View details"
                            aria-label="View details"
                            data-testid={`button-view-student-${student.id}`}
                          >
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Modify student details and save.</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => updateStudentMutation.mutate({ id: selectedStudent.id, data }))} className="space-y-4">
                {form.setValue('name', selectedStudent.name), null}
                {form.setValue('admissionNumber', selectedStudent.admissionNumber || undefined), null}
                {form.setValue('classId', selectedStudent.classId), null}
                {form.setValue('gender', selectedStudent.gender || undefined), null}
                {form.setValue('guardianName', selectedStudent.guardianName || undefined), null}
                {form.setValue('guardianPhone', selectedStudent.guardianPhone || undefined), null}
                {form.setValue('address', selectedStudent.address || undefined), null}
                {form.setValue('isHosteller', !!selectedStudent.isHosteller), null}
                {form.setValue('transportChosen', !!selectedStudent.transportChosen), null}
                {form.setValue('academicYear', selectedStudent.academicYear || activeAcademicYear || getCurrentAcademicYear()), null}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Name *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="admissionNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admission Number</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="classId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Array.isArray(classes) && (classes as any[]).map((cls: any) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="academicYear" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select academic year" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Array.isArray(years) && years.map((yearItem) => (
                            <SelectItem key={yearItem.code} value={yearItem.code}>
                              {yearItem.name || yearItem.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="guardianName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="guardianPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Phone</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex space-x-6">
                  <FormField control={form.control} name="isHosteller" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <div className="space-y-1 leading-none"><FormLabel>Hosteller</FormLabel></div>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="transportChosen" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <div className="space-y-1 leading-none"><FormLabel>Transport Required</FormLabel></div>
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={updateStudentMutation.isPending}>{updateStudentMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Move to Left (soft delete) Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Student as Left</DialogTitle>
            <DialogDescription>
              Are you sure you want to move {selectedStudent?.name} to the Left category? You can change status later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => selectedStudent && deleteStudentMutation.mutate(selectedStudent.id)}>
              {deleteStudentMutation.isPending ? 'Updating...' : 'Mark Left'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
