import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const transportFeeSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  routeName: z.string().min(1, "Route name is required"),
  monthlyAmount: z.string().min(1, "Monthly amount is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

export default function Transport() {
  const [selectedYear, setSelectedYear] = useState("2023-24");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof transportFeeSchema>>({
    resolver: zodResolver(transportFeeSchema),
    defaultValues: {
      academicYear: selectedYear,
      routeName: "",
      monthlyAmount: "",
      startDate: "",
      endDate: "",
    },
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: transportFees, isLoading: feesLoading } = useQuery({
    queryKey: ["/api/transport-fees", selectedYear],
    queryFn: () => fetch(`/api/transport-fees?academicYear=${selectedYear}`).then(res => res.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof transportFeeSchema>) => {
      const payload = {
        ...data,
        studentId: parseInt(data.studentId),
        monthlyAmount: data.monthlyAmount,
      };
      return apiRequest("POST", "/api/transport-fees", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-fees"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Transport fee record created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create transport fee record",
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

  const filteredTransportFees = transportFees?.filter((fee: any) =>
    fee.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fee.routeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (studentsLoading || feesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
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
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate summary stats
  const totalTransportStudents = transportFees?.length || 0;
  const totalMonthlyRevenue = transportFees?.reduce((sum: number, fee: any) => 
    sum + parseFloat(fee.monthlyAmount || 0), 0) || 0;
  const uniqueRoutes = [...new Set(transportFees?.map((fee: any) => fee.routeName) || [])].length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Transport Management</h2>
          <p className="text-muted-foreground">Manage van routes and transport fees</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023-24">Academic Year 2023-24</SelectItem>
              <SelectItem value="2022-23">Academic Year 2022-23</SelectItem>
              <SelectItem value="2024-25">Academic Year 2024-25</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-add-transport-fee">
                <i className="fas fa-plus mr-2"></i>
                Add Transport Fee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Transport Fee</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students?.map((student: any) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.name} - {student.class?.name}
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
                    name="routeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Route Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Route A, City Center" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Amount (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="finance-card" data-testid="card-transport-students">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Transport Students</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-transport-students">
                  {totalTransportStudents}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-bus text-purple-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="finance-card" data-testid="card-monthly-revenue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Monthly Revenue</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-monthly-revenue">
                  {formatCurrency(totalMonthlyRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-money-bill-wave text-secondary text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="finance-card" data-testid="card-routes">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Active Routes</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-active-routes">
                  {uniqueRoutes}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-route text-primary text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transport Fees Table */}
      <Card className="finance-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transport Fees ({filteredTransportFees?.length || 0})</CardTitle>
            <div className="flex items-center space-x-4">
              <Input
                type="text"
                placeholder="Search by student or route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80"
                data-testid="input-search-transport"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredTransportFees || filteredTransportFees.length === 0 ? (
            <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
              <div className="text-center">
                <i className="fas fa-bus text-4xl text-muted-foreground mb-3"></i>
                <p className="text-muted-foreground">
                  {searchQuery ? 'No transport fees found matching your search' : 'No transport fees found'}
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Route</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Monthly Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Start Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">End Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransportFees.map((fee: any, index: number) => (
                    <tr key={fee.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-transport-fee-${fee.id}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {fee.studentName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                          <span className="font-medium text-foreground" data-testid={`text-student-name-${index}`}>
                            {fee.studentName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid={`text-class-${index}`}>
                        {fee.className}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-purple-100 text-purple-600" data-testid={`badge-route-${index}`}>
                          {fee.routeName}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-foreground" data-testid={`text-amount-${index}`}>
                        {formatCurrency(fee.monthlyAmount)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid={`text-start-date-${index}`}>
                        {formatDate(fee.startDate)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid={`text-end-date-${index}`}>
                        {fee.endDate ? formatDate(fee.endDate) : 'Ongoing'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={fee.isActive ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'}>
                          {fee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" data-testid={`button-edit-transport-${fee.id}`}>
                            <i className="fas fa-edit text-muted-foreground"></i>
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-payment-transport-${fee.id}`}>
                            <i className="fas fa-credit-card text-primary"></i>
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-stop-transport-${fee.id}`}>
                            <i className="fas fa-stop text-destructive"></i>
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
