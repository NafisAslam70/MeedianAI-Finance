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

const feeStructureSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  feeType: z.enum(["monthly", "admission", "transport", "supply", "other"]),
  hostellerAmount: z.string().min(1, "Hosteller amount is required"),
  dayScholarAmount: z.string().min(1, "Day scholar amount is required"),
  description: z.string().optional(),
});

export default function FeeManagement() {
  const [selectedYear, setSelectedYear] = useState("2023-24");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof feeStructureSchema>>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      academicYear: selectedYear,
      feeType: "monthly",
      hostellerAmount: "",
      dayScholarAmount: "",
      description: "",
    },
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes"],
  });

  const { data: feeStructures, isLoading: structuresLoading } = useQuery({
    queryKey: ["/api/fee-structures", selectedYear],
    queryFn: () => fetch(`/api/fee-structures?academicYear=${selectedYear}`).then(res => res.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof feeStructureSchema>) => {
      const payload = {
        ...data,
        classId: parseInt(data.classId),
        hostellerAmount: data.hostellerAmount,
        dayScholarAmount: data.dayScholarAmount,
      };
      return apiRequest("POST", "/api/fee-structures", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-structures"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Fee structure created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create fee structure",
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

  const getFeeTypeBadge = (type: string) => {
    const variants = {
      'monthly': 'bg-primary/10 text-primary',
      'admission': 'bg-secondary/10 text-secondary',
      'transport': 'bg-purple-100 text-purple-600',
      'supply': 'bg-accent/10 text-accent',
      'other': 'bg-muted text-muted-foreground',
    };

    return variants[type as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  if (classesLoading || structuresLoading) {
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
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
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
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Fee Management</h2>
          <p className="text-muted-foreground">Manage fee structures by class and type</p>
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
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-add-fee-structure">
                <i className="fas fa-plus mr-2"></i>
                Add Fee Structure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Fee Structure</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes?.map((cls: any) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name} {cls.section && `(${cls.section})`}
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
                    name="feeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="admission">Admission</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="supply">Supply</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hostellerAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hosteller Amount (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dayScholarAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day Scholar Amount (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Additional details..." {...field} />
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

      {!feeStructures || feeStructures.length === 0 ? (
        <Card className="finance-card">
          <CardContent className="p-12">
            <div className="text-center">
              <i className="fas fa-receipt text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-medium text-foreground mb-2">No Fee Structures Found</h3>
              <p className="text-muted-foreground mb-4">Create fee structures for classes to get started.</p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <i className="fas fa-plus mr-2"></i>
                Create First Fee Structure
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="finance-card">
          <CardHeader>
            <CardTitle>Fee Structures for {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Class</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fee Type</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Hosteller Fee</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Day Scholar Fee</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feeStructures.map((structure: any, index: number) => (
                    <tr key={structure.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-fee-structure-${structure.id}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {structure.class?.name?.charAt(structure.class.name.length - 1) || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-foreground" data-testid={`text-class-name-${index}`}>
                            {structure.class?.name || 'Unknown Class'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getFeeTypeBadge(structure.feeType)} data-testid={`badge-fee-type-${index}`}>
                          {structure.feeType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-foreground" data-testid={`text-hosteller-fee-${index}`}>
                        {formatCurrency(structure.hostellerAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-foreground" data-testid={`text-day-scholar-fee-${index}`}>
                        {formatCurrency(structure.dayScholarAmount)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid={`text-description-${index}`}>
                        {structure.description || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={structure.isActive ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'}>
                          {structure.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" data-testid={`button-edit-structure-${structure.id}`}>
                            <i className="fas fa-edit text-muted-foreground"></i>
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-duplicate-structure-${structure.id}`}>
                            <i className="fas fa-copy text-primary"></i>
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-delete-structure-${structure.id}`}>
                            <i className="fas fa-trash text-destructive"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
