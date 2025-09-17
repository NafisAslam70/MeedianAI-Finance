import { useQuery } from "@tanstack/react-query";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import CollectionTrendChart from "@/components/dashboard/CollectionTrendChart";
import ClassFeeDistribution from "@/components/dashboard/ClassFeeDistribution";
import RecentPayments from "@/components/dashboard/RecentPayments";
import PendingActions from "@/components/dashboard/PendingActions";
import FeeStructureOverview from "@/components/dashboard/FeeStructureOverview";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: collectionTrend, isLoading: trendLoading } = useQuery({
    queryKey: ["/api/dashboard/collection-trend"],
  });

  const { data: classCollections, isLoading: collectionsLoading } = useQuery({
    queryKey: ["/api/dashboard/class-collections"],
  });

  const { data: recentPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments", "recent"],
    queryFn: () => fetch("/api/payments?limit=10").then(res => res.json()),
  });

  const { data: pendingActions, isLoading: actionsLoading } = useQuery({
    queryKey: ["/api/dashboard/pending-actions"],
  });

  const { data: feeStructureOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ["/api/dashboard/fee-structure-overview"],
  });

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

  return (
    <div className="space-y-8">
      {/* Financial Overview Cards */}
      <FinancialOverview stats={dashboardStats} />

      {/* Charts and Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CollectionTrendChart data={collectionTrend} />
        <ClassFeeDistribution data={classCollections} />
      </div>

      {/* Recent Transactions and Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentPayments payments={recentPayments} />
        </div>
        <PendingActions actions={pendingActions} />
      </div>

      {/* Fee Structure Overview */}
      <FeeStructureOverview overview={feeStructureOverview} />
    </div>
  );
}
