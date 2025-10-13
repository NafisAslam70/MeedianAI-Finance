import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { buildAcademicYearMonths, getCurrentAcademicYear, getCurrentMonthKey, formatAcademicMonth } from "@/lib/utils";
import { useFinancePeriod } from "@/context/FinancePeriodContext";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DuesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("due");
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>(() => getCurrentMonthKey());
  const [monthManuallyChosen, setMonthManuallyChosen] = useState(false);
  const { year: activeYear, years, setYear: setActiveYear } = useFinancePeriod();

  const { data: classes } = useQuery({ queryKey: ["/api/classes"] });

  const { data: dues, isLoading } = useQuery({
    queryKey: ["/api/dues", { statusFilter, viewMode, classFilter, monthFilter, activeYear }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("dueType", viewMode === "monthly" ? "monthly" : "one_time");
      if (classFilter !== "all") params.set("classId", classFilter);
      if (viewMode === "monthly" && monthFilter !== "all") params.set("month", monthFilter);
      if (activeYear) params.set("academicYear", activeYear);
      const res = await fetch(`/api/dues?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load dues');
      }
      return res.json();
    },
    enabled: Boolean(activeYear),
  });

  useEffect(() => {
    setMonthManuallyChosen(false);
    setMonthFilter(getCurrentMonthKey());
  }, [activeYear]);

  useEffect(() => {
    if (viewMode !== 'monthly') {
      setMonthFilter('all');
      setMonthManuallyChosen(false);
    }
  }, [viewMode]);

  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const list = Array.isArray(dues) ? dues : [];

    list.forEach((due: any) => {
      if (due?.academicYear) {
        buildAcademicYearMonths(due.academicYear).forEach((month) => monthSet.add(month));
      }
      if (due?.dueMonth) {
        monthSet.add(due.dueMonth);
      }
    });

    if (!monthSet.size) {
      const fallbackYear = activeYear || getCurrentAcademicYear();
      buildAcademicYearMonths(fallbackYear).forEach((month) => monthSet.add(month));
    }

    return Array.from(monthSet).sort((a, b) => a.localeCompare(b));
  }, [dues, activeYear]);

  useEffect(() => {
    if (viewMode !== 'monthly') {
      return;
    }

    const currentMonthKey = getCurrentMonthKey();

    if (!monthManuallyChosen) {
      if (availableMonths.includes(currentMonthKey)) {
        if (monthFilter !== currentMonthKey) {
          setMonthFilter(currentMonthKey);
        }
        return;
      }

      if (monthFilter === 'all' || !availableMonths.includes(monthFilter)) {
        const fallback = availableMonths[0] ?? currentMonthKey;
        if (monthFilter !== fallback) {
          setMonthFilter(fallback);
        }
      }
    } else if (monthFilter !== 'all' && !availableMonths.includes(monthFilter)) {
      const fallback = availableMonths[0] ?? 'all';
      if (monthFilter !== fallback) {
        setMonthFilter(fallback);
      }
    }
  }, [availableMonths, monthFilter, monthManuallyChosen, viewMode]);

  const selectedClassMeta = useMemo(() => {
    if (classFilter === 'all') return null;
    if (!Array.isArray(classes)) return null;
    return (classes as any[]).find((cls: any) => cls.id?.toString() === classFilter) ?? null;
  }, [classes, classFilter]);

  const filteredDues = useMemo(() => {
    const list = Array.isArray(dues) ? dues : [];
    const q = searchQuery.trim().toLowerCase();
    const selectedClassId = classFilter === 'all' ? null : Number(classFilter);
    const selectedClassName = selectedClassMeta?.name?.toLowerCase?.() ?? null;

    return list.filter((due: any) => {
      const matchesSearch = !q
        || (due.studentName || '').toLowerCase().includes(q)
        || (due.ledgerNumber || '').toLowerCase().includes(q)
        || (due.className || '').toLowerCase().includes(q)
        || (due.itemType || '').toLowerCase().includes(q);

      if (!matchesSearch) {
        return false;
      }

      if (selectedClassId === null) {
        return true;
      }

      const dueClassId = Number(due?.classId ?? NaN);
      if (Number.isFinite(dueClassId)) {
        return dueClassId === selectedClassId;
      }

      if (!selectedClassName) {
        return false;
      }

      const dueClassName = (due?.className ?? '').trim().toLowerCase();
      return dueClassName === selectedClassName;
    });
  }, [dues, searchQuery, classFilter, selectedClassMeta]);

  const displayedDues = useMemo(() => {
    const list = Array.isArray(filteredDues) ? filteredDues : [];
    if (viewMode !== 'monthly' || monthFilter === 'all') {
      return list;
    }
    return list.filter((due: any) => due.dueMonth === monthFilter);
  }, [filteredDues, viewMode, monthFilter]);

  const summary = useMemo(() => {
    const list = Array.isArray(displayedDues) ? displayedDues : [];
    return list.reduce((acc: { total: number; paid: number; pending: number }, due: any) => {
      const amount = parseFloat(String(due.amount ?? 0)) || 0;
      const paidRaw = parseFloat(String(due.paidAmount ?? 0)) || 0;
      const collected = Math.min(Math.max(paidRaw, 0), amount);
      const pending = Math.max(amount - collected, 0);
      return {
        total: acc.total + amount,
        paid: acc.paid + collected,
        pending: acc.pending + pending,
      };
    }, { total: 0, paid: 0, pending: 0 });
  }, [displayedDues]);

  const sortedYears = useMemo(
    () => [...years].sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return b.code.localeCompare(a.code);
    }),
    [years],
  );

  const handleYearChange = (value: string) => {
    setActiveYear(value);
  };

  if (!activeYear) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Student Dues</h2>
            <p className="text-muted-foreground">Select an academic year to review outstanding dues.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDueMonth = (month?: string | null) => formatAcademicMonth(month);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Student Dues</h2>
          <p className="text-muted-foreground">Review outstanding one-time and monthly dues.</p>
        </div>
        <div className="flex items-center gap-4">
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
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search students, ledger, class..."
            className="w-72"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Billed</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(summary.total)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Collected</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(summary.paid)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive">{formatCurrency(summary.pending)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Records</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{displayedDues?.length || 0}</CardContent>
        </Card>
      </div>

      <Card className="finance-card">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="due">Due</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as typeof viewMode)} className="rounded-md border border-border">
              <ToggleGroupItem value="monthly" className="px-3 py-1 text-sm" aria-label="Monthly dues">Monthly</ToggleGroupItem>
              <ToggleGroupItem value="yearly" className="px-3 py-1 text-sm" aria-label="Yearly dues">Yearly</ToggleGroupItem>
            </ToggleGroup>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {Array.isArray(classes) && (classes as any[]).map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {viewMode === 'monthly' && (
              <Select
                value={monthFilter}
                onValueChange={(value) => {
                  setMonthManuallyChosen(true);
                  setMonthFilter(value);
                }}
              >
                <SelectTrigger className="w-44"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>{formatDueMonth(month)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!displayedDues?.length ? (
            <div className="flex items-center justify-center h-56 bg-muted/50 rounded-lg">
              <div className="text-center">
                <i className="fas fa-check-circle text-4xl text-muted-foreground mb-3"></i>
                <p className="text-muted-foreground">No dues for the selected filters</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ledger</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Class</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Item</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Due Month</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Paid</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pending</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDues.map((due: any, index: number) => {
                    const amount = Number(due.amount ?? 0);
                    const paid = Number(due.paidAmount ?? 0);
                    const pending = Math.max(amount - paid, 0);
                    const statusClasses: Record<string, string> = {
                      due: 'bg-destructive/10 text-destructive',
                      partial: 'bg-amber-100 text-amber-700',
                      paid: 'bg-emerald-100 text-emerald-700',
                    };
                    const statusMeta = statusClasses[due.status as keyof typeof statusClasses] || 'bg-muted text-muted-foreground';

                    return (
                      <tr key={due.id ?? `${due.studentId}-${index}`} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 text-foreground">
                          <div className="font-medium">{due.studentName || 'Unknown Student'}</div>
                          <div className="text-sm text-muted-foreground">{due.isHosteller ? 'Hosteller' : 'Day Scholar'}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-foreground">{due.ledgerNumber || '—'}</td>
                        <td className="py-3 px-4 text-foreground">{due.className || '—'}</td>
                        <td className="py-3 px-4">
                          <Badge className={due.dueType === 'one_time' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}>
                            {due.dueType === 'one_time' ? 'One Time' : 'Monthly'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-foreground uppercase">{due.itemType}</td>
                        <td className="py-3 px-4 text-foreground">{viewMode === 'monthly' ? formatDueMonth(due.dueMonth) : '—'}</td>
                        <td className="py-3 px-4 text-foreground">{formatCurrency(amount)}</td>
                        <td className="py-3 px-4 text-foreground">{formatCurrency(paid)}</td>
                        <td className="py-3 px-4 text-foreground font-medium">{formatCurrency(pending)}</td>
                        <td className="py-3 px-4">
                          <Badge className={statusMeta}>{due.status}</Badge>
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
    </div>
  );
}
