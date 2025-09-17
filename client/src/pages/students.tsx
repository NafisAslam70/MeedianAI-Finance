import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/students"],
  });

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

  const filteredStudents = students?.filter((student: any) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Student Management</h2>
          <p className="text-muted-foreground">Manage student records and fee information</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-add-student">
          <i className="fas fa-plus mr-2"></i>
          Add Student
        </Button>
      </div>

      <Card className="finance-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Students ({filteredStudents?.length || 0})</CardTitle>
            <div className="flex items-center space-x-4">
              <Input
                type="text"
                placeholder="Search by name or admission number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80"
                data-testid="input-search-students"
              />
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
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Admission No.</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Class</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fee Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student: any, index: number) => (
                    <tr key={student.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-student-${student.id}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {student.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground" data-testid={`text-student-name-${index}`}>
                              {student.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student.guardianName && `Guardian: ${student.guardianName}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground" data-testid={`text-admission-number-${index}`}>
                        {student.admissionNumber || '-'}
                      </td>
                      <td className="py-3 px-4 text-foreground" data-testid={`text-class-${index}`}>
                        {student.class?.name || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={student.isHosteller ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'}>
                          {student.isHosteller ? 'Hosteller' : 'Day Scholar'}
                        </Badge>
                        {student.transportChosen && (
                          <Badge className="ml-2 bg-purple-100 text-purple-600">Transport</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getFeeStatusBadge(student.feeStatus)} data-testid={`badge-fee-status-${index}`}>
                          {student.feeStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusBadge(student.status)} data-testid={`badge-status-${index}`}>
                          {student.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" data-testid={`button-view-student-${student.id}`}>
                            <i className="fas fa-eye text-primary"></i>
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-edit-student-${student.id}`}>
                            <i className="fas fa-edit text-muted-foreground"></i>
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-payment-student-${student.id}`}>
                            <i className="fas fa-credit-card text-secondary"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
