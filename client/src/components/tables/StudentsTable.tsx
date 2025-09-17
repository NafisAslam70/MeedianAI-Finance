import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Student {
  id: number;
  name: string;
  admissionNumber?: string;
  classId: number;
  isHosteller: boolean;
  transportChosen: boolean;
  feeStatus: string;
  status: string;
  guardianName?: string;
  class?: {
    id: number;
    name: string;
    section?: string;
    track?: string;
    active: boolean;
  };
}

interface StudentsTableProps {
  students: Student[];
  isLoading?: boolean;
  onViewStudent?: (student: Student) => void;
  onEditStudent?: (student: Student) => void;
  onRecordPayment?: (student: Student) => void;
}

export default function StudentsTable({ 
  students = [], 
  isLoading = false,
  onViewStudent,
  onEditStudent,
  onRecordPayment
}: StudentsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card className="finance-card">
        <CardHeader>
          <CardTitle>Loading Students...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin text-4xl text-muted-foreground mb-3"></i>
              <p className="text-muted-foreground">Loading student data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="finance-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Students ({filteredStudents.length})</CardTitle>
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              placeholder="Search by name or admission number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80"
              data-testid="input-search-students-table"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredStudents.length === 0 ? (
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
                {filteredStudents.map((student, index) => (
                  <tr key={student.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-student-table-${student.id}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground" data-testid={`text-student-table-name-${index}`}>
                            {student.name}
                          </p>
                          {student.guardianName && (
                            <p className="text-sm text-muted-foreground">
                              Guardian: {student.guardianName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-foreground" data-testid={`text-admission-table-number-${index}`}>
                      {student.admissionNumber || '-'}
                    </td>
                    <td className="py-3 px-4 text-foreground" data-testid={`text-class-table-${index}`}>
                      {student.class?.name || '-'}
                      {student.class?.section && ` (${student.class.section})`}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col space-y-1">
                        <Badge className={student.isHosteller ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'}>
                          {student.isHosteller ? 'Hosteller' : 'Day Scholar'}
                        </Badge>
                        {student.transportChosen && (
                          <Badge className="bg-purple-100 text-purple-600">Transport</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getFeeStatusBadge(student.feeStatus)} data-testid={`badge-fee-table-status-${index}`}>
                        {student.feeStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusBadge(student.status)} data-testid={`badge-table-status-${index}`}>
                        {student.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onViewStudent?.(student)}
                          data-testid={`button-view-table-student-${student.id}`}
                        >
                          <i className="fas fa-eye text-primary"></i>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onEditStudent?.(student)}
                          data-testid={`button-edit-table-student-${student.id}`}
                        >
                          <i className="fas fa-edit text-muted-foreground"></i>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onRecordPayment?.(student)}
                          data-testid={`button-payment-table-student-${student.id}`}
                        >
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
  );
}
