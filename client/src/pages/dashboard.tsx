import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import CollectionTrendChart from "@/components/dashboard/CollectionTrendChart";
import ClassFeeDistribution from "@/components/dashboard/ClassFeeDistribution";
import RecentPayments from "@/components/dashboard/RecentPayments";
import PendingActions from "@/components/dashboard/PendingActions";
import FeeStructureOverview from "@/components/dashboard/FeeStructureOverview";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useFinancePeriod } from "@/context/FinancePeriodContext";

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

interface PendingAction {
  type: string;
  title: string;
  description: string;
  count: number;
  icon: string;
  color: string;
  action?: string;
}

interface FeeStructureItem {
  className: string;
  classCode: string;
  totalStudents: number;
  hostellers: number;
  dayScholars: number;
  hostellerFee: number;
  dayScholarFee: number;
  expectedMonthly: number;
  actualCollection: number;
  variance: number;
}

export default function Dashboard() {
  const {
    year: selectedYear,
    years,
    month: selectedMonth,
  } = useFinancePeriod();

  const hasSelectedYear = Boolean(selectedYear);

  const activeYear = useMemo(
    () => years.find((item) => item.code === selectedYear) ?? null,
    [years, selectedYear],
  );

  const { data: dashboardStats, isLoading: statsLoading } = useQuery<FinancialStats | undefined>({
    queryKey: ["/api/dashboard/stats", selectedYear],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/dashboard/stats?academicYear=${encodeURIComponent(selectedYear ?? "")}`,
      );
      return response.json();
    },
    enabled: hasSelectedYear,
  });

  const { data: collectionTrend, isLoading: trendLoading } = useQuery({
    queryKey: ["/api/dashboard/collection-trend", selectedYear],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/dashboard/collection-trend?academicYear=${encodeURIComponent(selectedYear ?? "")}`,
      );
      return response.json();
    },
    enabled: hasSelectedYear,
  });

  const { data: classCollections, isLoading: collectionsLoading } = useQuery<ClassCollection[]>({
    queryKey: ["/api/dashboard/class-collections", selectedYear],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/dashboard/class-collections?academicYear=${encodeURIComponent(selectedYear ?? "")}`,
      );
      return response.json();
    },
    enabled: hasSelectedYear,
  });

  const { data: recentPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments", "recent", selectedYear],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/payments?limit=10&academicYear=${encodeURIComponent(selectedYear ?? "")}`,
      );
      return response.json();
    },
    enabled: hasSelectedYear,
  });

  const { data: pendingActions = [], isLoading: actionsLoading } = useQuery<PendingAction[]>({
    queryKey: ["/api/dashboard/pending-actions"],
  });

  const { data: feeStructureOverview, isLoading: overviewLoading } = useQuery<FeeStructureItem[]>({
    queryKey: ["/api/dashboard/fee-structure-overview", selectedYear],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/dashboard/fee-structure-overview?academicYear=${encodeURIComponent(selectedYear ?? "")}`,
      );
      return response.json();
    },
    enabled: hasSelectedYear,
  });

  if (!hasSelectedYear) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Academic Years</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          No academic years available yet. Create one from the header to get started.
        </p>
      </div>
    );
  }

  if (statsLoading || trendLoading || collectionsLoading || paymentsLoading || actionsLoading || overviewLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  const displayYearLabel = activeYear?.name ?? selectedYear;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>
            Viewing data for <span className="font-medium text-foreground">{displayYearLabel}</span>
          </span>
          <span>
            Focus month <span className="font-medium text-foreground">{selectedMonth}</span>
          </span>
        </div>
      </section>

      <FinancialOverview stats={dashboardStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CollectionTrendChart data={collectionTrend} />
        <ClassFeeDistribution data={classCollections} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentPayments payments={recentPayments} />
        </div>
        <PendingActions actions={pendingActions} />
      </div>

      <FeeStructureOverview overview={feeStructureOverview} />
    </div>
  );
}
