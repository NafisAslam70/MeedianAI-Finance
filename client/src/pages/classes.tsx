import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema } from "../../../shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { cn } from "@/lib/utils";

export default function Classes() {
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes"],
  });

  const { data: classCollections, isLoading: collectionsLoading } = useQuery({
    queryKey: ["/api/dashboard/class-collections"],
  });

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "hosteller" | "dayscholar">("all");
  const [feeStatusFilter, setFeeStatusFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [transportFilter, setTransportFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { toast } = useToast();

  const { data: students, isFetching: studentsLoading } = useQuery({
    queryKey: ["/api/students"],
    enabled: isDetailsOpen,
  });

  const formSchema = insertStudentSchema.extend({
    classId: z.number().min(1, "Please select a class"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
    },
  });

  useEffect(() => {
    if (!selectedStudent) {
      return;
    }

    form.reset({
      name: selectedStudent.name || "",
      admissionNumber: selectedStudent.admissionNumber || undefined,
      classId: selectedStudent.classId || 0,
      gender: selectedStudent.gender || undefined,
      guardianName: selectedStudent.guardianName || undefined,
      guardianPhone: selectedStudent.guardianPhone || undefined,
      address: selectedStudent.address || undefined,
      isHosteller: !!selectedStudent.isHosteller,
      transportChosen: !!selectedStudent.transportChosen,
      feeStatus: selectedStudent.feeStatus || "Pending",
      status: selectedStudent.status || "active",
    });
  }, [selectedStudent, form]);

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof formSchema> }) => {
      return apiRequest('PATCH', `/api/students/${id}`, data);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/students'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/class-collections'] }),
      ]);
      setIsEditDialogOpen(false);
      toast({ title: 'Updated', description: 'Student updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update student', variant: 'destructive' });
    },
  });

  const openAccountMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const response = await apiRequest('POST', `/api/students/${studentId}/open-account`, {});
      return response.json().catch(() => null);
    },
    onSuccess: async (payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/students'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/class-collections'] }),
      ]);
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
    },
  });

  const resetFilters = () => {
    setStudentSearch('');
    setTypeFilter('all');
    setFeeStatusFilter('all');
    setStatusFilter('all');
    setTransportFilter('all');
    setAccountFilter('all');
  };

  const getAccountStatusMeta = (student: any) => {
    if (!student?.accountOpened) {
      return { label: 'Not opened', className: 'bg-muted text-muted-foreground' };
    }

    if ((student?.accountStatus || '').toLowerCase() === 'closed') {
      return { label: 'Closed', className: 'bg-muted text-muted-foreground' };
    }

    return { label: 'Open', className: 'bg-emerald-100 text-emerald-700' };
  };

  const getFeeStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'paid': 'bg-secondary/10 text-secondary',
      'pending': 'bg-accent/10 text-accent',
      'overdue': 'bg-destructive/10 text-destructive',
      'partial': 'bg-amber-100 text-amber-700',
    };

    return variants[status?.toLowerCase()] || 'bg-muted text-muted-foreground';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'active': 'bg-secondary/10 text-secondary',
      'inactive': 'bg-muted text-muted-foreground',
      'graduated': 'bg-primary/10 text-primary',
      'left': 'bg-destructive/10 text-destructive',
    };

    return variants[status?.toLowerCase()] || 'bg-muted text-muted-foreground';
  };

  const getClassStats = (classId: number) => {
    if (!Array.isArray(classCollections)) {
      return {
        collection: 0,
        studentCount: 0,
        hostellers: 0,
        dayScholars: 0,
        expectedCollection: 0,
      };
    }

    return classCollections.find((collection: any) => collection.classId === classId) || {
      collection: 0,
      studentCount: 0,
      hostellers: 0,
      dayScholars: 0,
      expectedCollection: 0,
    };
  };

  const classStudents = useMemo(() => {
    if (!Array.isArray(students) || !selectedClass) {
      return [];
    }

    return (students as any[]).filter((student) => Number(student.classId) === Number(selectedClass.id));
  }, [students, selectedClass]);

  const selectedClassStats = selectedClass ? getClassStats(selectedClass.id) : null;

  const uniqueFeeStatuses = useMemo(() => {
    const set = new Set<string>();
    classStudents.forEach((student: any) => {
      if (student?.feeStatus) {
        set.add(student.feeStatus);
      }
    });
    return Array.from(set);
  }, [classStudents]);

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    classStudents.forEach((student: any) => {
      if (student?.status) {
        set.add(student.status);
      }
    });
    return Array.from(set);
  }, [classStudents]);

  const filteredStudents = useMemo(() => {
    return classStudents.filter((student: any) => {
      const matchesSearch = studentSearch
        ? [student.name, student.admissionNumber, student.guardianName, student.guardianPhone]
            .filter(Boolean)
            .some((value) => value.toString().toLowerCase().includes(studentSearch.toLowerCase()))
        : true;

      const matchesType = typeFilter === 'all'
        ? true
        : typeFilter === 'hosteller'
          ? !!student.isHosteller
          : !student.isHosteller;

      const matchesFeeStatus = feeStatusFilter === 'all'
        ? true
        : (student?.feeStatus || '').toLowerCase() === feeStatusFilter.toLowerCase();

      const matchesStatus = statusFilter === 'all'
        ? true
        : (student?.status || '').toLowerCase() === statusFilter.toLowerCase();

      const matchesTransport = transportFilter === 'all'
        ? true
        : transportFilter === 'transport'
          ? !!student.transportChosen
          : !student.transportChosen;

      const matchesAccount = accountFilter === 'all'
        ? true
        : accountFilter === 'open'
          ? !!student.accountOpened && (student.accountStatus || '').toLowerCase() !== 'closed'
          : accountFilter === 'closed'
            ? (student.accountStatus || '').toLowerCase() === 'closed'
            : !student.accountOpened;

      return matchesSearch && matchesType && matchesFeeStatus && matchesStatus && matchesTransport && matchesAccount;
    });
  }, [classStudents, studentSearch, typeFilter, feeStatusFilter, statusFilter, transportFilter, accountFilter]);

  const hasActiveFilters = useMemo(() => {
    return typeFilter !== 'all'
      || feeStatusFilter !== 'all'
      || statusFilter !== 'all'
      || transportFilter !== 'all'
      || accountFilter !== 'all'
      || studentSearch.trim().length > 0;
  }, [typeFilter, feeStatusFilter, statusFilter, transportFilter, accountFilter, studentSearch]);

  useEffect(() => {
    if (!isDetailsOpen) {
      setSelectedClass(null);
      setSelectedStudent(null);
      setIsEditDialogOpen(false);
      resetFilters();
    }
  }, [isDetailsOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (classesLoading || collectionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-24" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Class Management</h2>
          <p className="text-muted-foreground">Manage classes and their fee structures</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-add-class">
          <i className="fas fa-plus mr-2"></i>
          Add Class
        </Button>
      </div>

      {!classes || classes.length === 0 ? (
        <Card className="finance-card">
          <CardContent className="p-12">
            <div className="text-center">
              <i className="fas fa-graduation-cap text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-medium text-foreground mb-2">No Classes Found</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first class.</p>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <i className="fas fa-plus mr-2"></i>
                Add First Class
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem: any) => {
            const stats = getClassStats(classItem.id);
            const collectionPercentage = stats.expectedCollection > 0 
              ? Math.round((stats.collection / stats.expectedCollection) * 100) 
              : 0;

            return (
              <Card key={classItem.id} className="finance-card" data-testid={`card-class-${classItem.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg" data-testid={`text-class-name-${classItem.id}`}>
                      {classItem.name}
                      {classItem.section && <span className="text-muted-foreground ml-1">({classItem.section})</span>}
                    </CardTitle>
                    <Badge variant={classItem.active ? "default" : "secondary"} data-testid={`badge-class-status-${classItem.id}`}>
                      {classItem.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {classItem.track && (
                      <div>
                        <p className="text-sm text-muted-foreground">Track</p>
                        <p className="font-medium text-foreground capitalize" data-testid={`text-track-${classItem.id}`}>
                          {classItem.track.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Students</p>
                      <p className="font-medium text-foreground" data-testid={`text-student-count-${classItem.id}`}>
                        {stats.studentCount} enrolled
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Collection</p>
                      <p className="text-xl font-bold text-foreground" data-testid={`text-collection-${classItem.id}`}>
                        {formatCurrency(stats.collection)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>Expected: {formatCurrency(stats.expectedCollection)}</span>
                        <span className={collectionPercentage >= 80 ? 'text-secondary' : collectionPercentage >= 60 ? 'text-accent' : 'text-destructive'}>
                          {collectionPercentage}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Collection Progress</p>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            collectionPercentage >= 80 ? 'bg-secondary' : 
                            collectionPercentage >= 60 ? 'bg-accent' : 'bg-destructive'
                          }`}
                          style={{ width: `${Math.min(collectionPercentage, 100)}%` }}
                          data-testid={`progress-collection-${classItem.id}`}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-view-class-${classItem.id}`}
                        onClick={() => {
                          resetFilters();
                          setSelectedClass(classItem);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <i className="fas fa-eye mr-2"></i>
                        View Details
                      </Button>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-class-${classItem.id}`}>
                          <i className="fas fa-edit text-muted-foreground"></i>
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-students-class-${classItem.id}`}>
                          <i className="fas fa-users text-primary"></i>
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-fees-class-${classItem.id}`}>
                          <i className="fas fa-receipt text-secondary"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              {selectedClass
                ? `${selectedClass.name}${selectedClass.section ? ` (${selectedClass.section})` : ''}`
                : 'Class details'}
            </DialogTitle>
            <DialogDescription>
              {selectedClass && selectedClassStats
                ? `${selectedClassStats.studentCount} students • ${formatCurrency(selectedClassStats.collection)} collected this month`
                : 'Review students assigned to this class, manage accounts, and edit records.'}
            </DialogDescription>
          </DialogHeader>

          {selectedClass ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={selectedClass.active ? 'default' : 'secondary'}>
                  {selectedClass.active ? 'Active class' : 'Inactive class'}
                </Badge>
                {selectedClass.track && (
                  <Badge variant="outline" className="capitalize">
                    {selectedClass.track.replace('_', ' ')} track
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Students</p>
                  <p className="text-xl font-bold text-foreground">{classStudents.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {filteredStudents.length === classStudents.length
                      ? 'All students visible'
                      : `${filteredStudents.length} student${filteredStudents.length === 1 ? '' : 's'} match filters`}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hostellers</p>
                  <p className="text-xl font-bold text-foreground">{selectedClassStats?.hostellers ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{selectedClassStats?.dayScholars ?? 0} day scholars</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monthly Collection</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(selectedClassStats?.collection ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">
                    Target {formatCurrency(selectedClassStats?.expectedCollection ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Insights</p>
                  <p className="text-xl font-bold text-foreground">
                    {selectedClassStats?.studentCount
                      ? `${Math.round((selectedClassStats.collection / Math.max(selectedClassStats.expectedCollection, 1)) * 100)}%`
                      : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Collection vs expected</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Search by name, admission number, or guardian"
                  className="md:w-64"
                />
                <div className="flex flex-wrap gap-2">
                  <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="Student type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="hosteller">Hosteller</SelectItem>
                      <SelectItem value="dayscholar">Day Scholar</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={feeStatusFilter} onValueChange={setFeeStatusFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="Fee status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All fee statuses</SelectItem>
                      {[...uniqueFeeStatuses].sort((a, b) => a.localeCompare(b)).map((status) => (
                        <SelectItem key={status} value={status.toLowerCase()}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="Student status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {[...uniqueStatuses].sort((a, b) => a.localeCompare(b)).map((status) => (
                        <SelectItem key={status} value={status.toLowerCase()}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={accountFilter} onValueChange={setAccountFilter}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Account" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All accounts</SelectItem>
                      <SelectItem value="open">Accounts open</SelectItem>
                      <SelectItem value="closed">Accounts closed</SelectItem>
                      <SelectItem value="not-opened">Not opened</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={transportFilter} onValueChange={setTransportFilter}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Transport" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All transport</SelectItem>
                      <SelectItem value="transport">Opted for transport</SelectItem>
                      <SelectItem value="no-transport">No transport</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>

              {studentsLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
                  <i className="fas fa-spinner fa-spin text-xl" />
                  <p>Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
                  <i className="fas fa-user-graduate text-xl" />
                  <p>No students match the current filters.</p>
                </div>
              ) : (
                <ScrollArea className="h-[420px] rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[220px]">Student</TableHead>
                        <TableHead className="min-w-[120px]">Admission #</TableHead>
                        <TableHead className="min-w-[120px]">Fee status</TableHead>
                        <TableHead className="min-w-[150px]">Account</TableHead>
                        <TableHead className="min-w-[160px]">Type</TableHead>
                        <TableHead className="min-w-[120px]">Status</TableHead>
                        <TableHead className="text-right min-w-[160px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student: any) => {
                        const accountMeta = getAccountStatusMeta(student);
                        const isOpeningAccount = openAccountMutation.isPending && openAccountMutation.variables === student.id;

                        return (
                          <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-foreground">{student.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {(student.guardianName || student.guardianPhone)
                                    ? [student.guardianName, student.guardianPhone].filter(Boolean).join(' • ')
                                    : 'Guardian details unavailable'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-foreground">
                              {student.admissionNumber || '—'}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn('px-2 py-0.5 text-[11px] font-medium', getFeeStatusBadge(student.feeStatus))}>
                                {student.feeStatus || '—'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="font-mono text-xs text-foreground">{student.ledgerNumber || '—'}</span>
                                <Badge className={cn('px-2 py-0.5 text-[10px] font-medium', accountMeta.className)}>
                                  {accountMeta.label}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-1">
                                <Badge className={cn('px-2 py-0.5 text-[11px] font-medium', student.isHosteller ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground')}>
                                  {student.isHosteller ? 'Hosteller' : 'Day Scholar'}
                                </Badge>
                                {student.transportChosen && (
                                  <Badge className="px-2 py-0.5 text-[10px] bg-purple-100 text-purple-600">
                                    Transport
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn('px-2 py-0.5 text-[11px] font-medium', getStatusBadge(student.status))}>
                                {student.status || '—'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {!student.accountOpened && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => openAccountMutation.mutate(student.id)}
                                    disabled={isOpeningAccount}
                                  >
                                    {isOpeningAccount ? <i className="fas fa-spinner fa-spin" /> : 'Open account'}
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              Select a class to view students.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setSelectedStudent(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit student</DialogTitle>
            <DialogDescription>Update student details and save changes.</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => updateStudentMutation.mutate({ id: selectedStudent.id, data }))}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student name *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="admissionNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admission number</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value ? field.value.toString() : undefined}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                          </FormControl>
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
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
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
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="guardianName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guardian name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guardianPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guardian phone</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
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
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap items-center gap-6">
                  <FormField
                    control={form.control}
                    name="isHosteller"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Hosteller</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transportChosen"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Transport opted</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="feeStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select fee status" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                            <SelectItem value="Partial">Partial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="graduated">Graduated</SelectItem>
                            <SelectItem value="left">Left</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateStudentMutation.isPending}>
                    {updateStudentMutation.isPending ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
