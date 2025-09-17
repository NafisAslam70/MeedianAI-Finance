import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Classes() {
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes"],
  });

  const { data: classCollections, isLoading: collectionsLoading } = useQuery({
    queryKey: ["/api/dashboard/class-collections"],
  });

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

  const getClassStats = (className: string) => {
    return classCollections?.find((collection: any) => collection.className === className) || {
      collection: 0,
      studentCount: 0,
      expectedCollection: 0
    };
  };

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
            const stats = getClassStats(classItem.name);
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
                      <Button variant="outline" size="sm" data-testid={`button-view-class-${classItem.id}`}>
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
    </div>
  );
}
