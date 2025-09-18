import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema, type InsertStudent } from "../../../shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
  });

  const createStudentMutation = useMutation({
    mutationFn: (data: InsertStudent) => apiRequest('POST', '/api/students', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Student added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    },
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
      isHosteller: false,
      transportChosen: false,
      guardianName: undefined,
      guardianPhone: undefined,
      gender: undefined,
      address: undefined,
      feeStatus: "Pending",
      status: "active",
    },
  });

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

  const filteredStudents = (Array.isArray(students) ? students : [])?.filter((student: any) =>
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
                <div className="grid grid-cols-2 gap-4">
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
