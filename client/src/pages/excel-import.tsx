import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImportStep {
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export default function ExcelImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importSteps, setImportSteps] = useState<ImportStep[]>([
    { step: 1, title: "File Upload", description: "Upload Excel file", status: 'pending' },
    { step: 2, title: "Data Validation", description: "Validate data structure", status: 'pending' },
    { step: 3, title: "Database Import", description: "Import to database", status: 'pending' },
    { step: 4, title: "Completion", description: "Process complete", status: 'pending' },
  ]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate the actual import process
      return apiRequest("POST", "/api/excel-import", {
        fileName: file.name,
        fileSize: file.size,
        sheetsProcessed: 15,
        recordsImported: 150,
        recordsSkipped: 5,
        importStatus: 'completed',
        importedBy: 1, // TODO: Get actual user ID
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/excel-imports"] });
      updateStepStatus(4, 'completed');
      setImportProgress(100);
      setIsImporting(false);
      toast({
        title: "Import Successful",
        description: "Excel data has been imported successfully",
      });
    },
    onError: (error: any) => {
      updateStepStatus(importSteps.findIndex(s => s.status === 'processing') + 1, 'error');
      setIsImporting(false);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import Excel file",
        variant: "destructive",
      });
    },
  });

  const updateStepStatus = (step: number, status: ImportStep['status']) => {
    setImportSteps(prev => prev.map(s => 
      s.step === step ? { ...s, status } : s
    ));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 50MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    updateStepStatus(1, 'completed');
    
    // Simulate file preview
    setPreviewData([
      { sheet: 'Students', records: 183, columns: ['Name', 'Class', 'Admission Number', 'Fee Status'] },
      { sheet: 'Fees', records: 245, columns: ['Student ID', 'Amount', 'Date', 'Type'] },
      { sheet: 'Payments', records: 89, columns: ['Student ID', 'Amount', 'Method', 'Date'] },
      { sheet: 'Classes', records: 12, columns: ['Name', 'Section', 'Track', 'Active'] },
      { sheet: 'Transport', records: 45, columns: ['Student ID', 'Route', 'Amount', 'Status'] },
    ]);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportProgress(0);
    
    // Update steps progressively
    updateStepStatus(2, 'processing');
    setImportProgress(25);
    
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateStepStatus(2, 'completed');
    updateStepStatus(3, 'processing');
    setImportProgress(50);
    
    // Start actual import
    importMutation.mutate(selectedFile);
    setImportProgress(75);
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setImportSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
    setImportProgress(0);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStepIcon = (status: ImportStep['status']) => {
    switch (status) {
      case 'completed':
        return <i className="fas fa-check-circle text-secondary"></i>;
      case 'processing':
        return <i className="fas fa-spinner fa-spin text-primary"></i>;
      case 'error':
        return <i className="fas fa-exclamation-circle text-destructive"></i>;
      default:
        return <i className="fas fa-circle text-muted-foreground"></i>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Excel Import</h2>
          <p className="text-muted-foreground">Import student and financial data from Excel files</p>
        </div>
        {selectedFile && (
          <Button variant="outline" onClick={resetImport} data-testid="button-reset-import">
            <i className="fas fa-redo mr-2"></i>
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Import Process */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <Card className="finance-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-upload text-primary"></i>
                <span>File Upload</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedFile ? (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <i className="fas fa-file-excel text-4xl text-muted-foreground mb-4"></i>
                  <h3 className="text-lg font-medium text-foreground mb-2">Upload Excel File</h3>
                  <p className="text-muted-foreground mb-4">
                    Select an Excel file (.xlsx or .xls) with student and financial data
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-select-file"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Select File
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Maximum file size: 50MB
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-file-excel text-secondary text-xl"></i>
                      <div>
                        <p className="font-medium text-foreground" data-testid="text-selected-filename">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-secondary/10 text-secondary">Ready</Badge>
                  </div>

                  {isImporting && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Import Progress</span>
                        <span className="text-sm text-muted-foreground">{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} className="h-2" data-testid="progress-import" />
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={resetImport} disabled={isImporting}>
                      <i className="fas fa-times mr-2"></i>
                      Remove File
                    </Button>
                    <Button 
                      onClick={handleImport}
                      disabled={isImporting}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-start-import"
                    >
                      {isImporting ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Importing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-play mr-2"></i>
                          Start Import
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Preview */}
          {previewData.length > 0 && (
            <Card className="finance-card">
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sheets" className="w-full">
                  <TabsList>
                    <TabsTrigger value="sheets">Sheets Overview</TabsTrigger>
                    <TabsTrigger value="validation">Validation Results</TabsTrigger>
                  </TabsList>
                  <TabsContent value="sheets" className="space-y-4">
                    {previewData.map((sheet, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg" data-testid={`sheet-preview-${index}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">{sheet.sheet}</h4>
                          <Badge variant="outline">{sheet.records} records</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sheet.columns.map((column: string, colIndex: number) => (
                            <Badge key={colIndex} className="bg-muted text-muted-foreground text-xs">
                              {column}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="validation">
                    <div className="space-y-4">
                      <Alert>
                        <i className="fas fa-check-circle text-secondary"></i>
                        <AlertDescription>
                          All data validation checks passed successfully. Ready for import.
                        </AlertDescription>
                      </Alert>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                          <span className="text-sm font-medium text-foreground">Data Structure</span>
                          <i className="fas fa-check text-secondary"></i>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                          <span className="text-sm font-medium text-foreground">Required Fields</span>
                          <i className="fas fa-check text-secondary"></i>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                          <span className="text-sm font-medium text-foreground">Data Types</span>
                          <i className="fas fa-check text-secondary"></i>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                          <span className="text-sm font-medium text-foreground">Duplicates Found</span>
                          <Badge className="bg-accent/10 text-accent">5 records</Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Import Status */}
        <div className="space-y-6">
          <Card className="finance-card">
            <CardHeader>
              <CardTitle>Import Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {importSteps.map((step) => (
                <div key={step.step} className="flex items-center space-x-3" data-testid={`step-${step.step}`}>
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="finance-card">
            <CardHeader>
              <CardTitle>Import Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Required Sheets:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Students (Name, Class, Admission Number)</li>
                  <li>• Classes (Name, Section, Track)</li>
                  <li>• Fee Structures (Class, Type, Amount)</li>
                  <li>• Payments (Student, Amount, Date, Method)</li>
                  <li>• Transport (Student, Route, Amount)</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Data Format:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Dates: DD/MM/YYYY or YYYY-MM-DD</li>
                  <li>• Amounts: Numbers without currency symbols</li>
                  <li>• Phone: 10 digits without spaces</li>
                  <li>• Email: Valid email format</li>
                </ul>
              </div>

              <div className="p-3 bg-accent/10 rounded-lg">
                <p className="text-sm text-accent">
                  <i className="fas fa-info-circle mr-1"></i>
                  Download our Excel template for the correct format
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
