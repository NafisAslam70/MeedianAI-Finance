import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as XLSX from "xlsx";
import { storage } from "./storage";
import { insertPaymentSchema, insertFeeStructureSchema, insertStudentFeeSchema, insertTransportFeeSchema, insertExcelImportSchema, insertStudentSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for direct buffer access
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Be more permissive with file validation - check extension only
    const allowedExtensions = ['.xlsx', '.xls'];
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .xlsx and .xls files are allowed.'));
    }
  }
});

const paymentMethodValues = ["cash", "upi", "bank", "bank_transfer", "cheque", "online"] as const;

const optionalDueId = z.preprocess(
  (value) => (value === null || value === undefined || value === "" ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

const recordPaymentAllocationSchema = z.object({
  dueId: optionalDueId,
  amount: z.coerce.number().positive({ message: "Amount must be greater than zero" }),
  label: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
}).superRefine((value, ctx) => {
  if (!value.dueId && !(value.label || value.category || value.notes)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide a description for custom charges",
      path: ["label"],
    });
  }
});

const recordPaymentSchema = z.object({
  studentId: z.coerce.number().int().positive({ message: "Student is required" }),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(paymentMethodValues, { message: "Invalid payment method" }),
  referenceNumber: z.string().trim().min(1).optional(),
  remarks: z.string().trim().min(1).optional(),
  academicYear: z.string().trim().min(1, "Academic year is required"),
  allocations: z.array(recordPaymentAllocationSchema).min(1, "Select at least one fee component"),
  verify: z.boolean().optional(),
  createdBy: z.coerce.number().int().optional(),
});

const createAcademicYearSchema = z.object({
  code: z.string().trim().min(1, "Code is required"),
  name: z.string().trim().min(1).optional(),
  startDate: z.string().trim().min(1).optional(),
  endDate: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
  isCurrent: z.boolean().optional(),
});

type RegisterRoutesOptions = {
  createHttpServer?: boolean;
};

export async function registerRoutes(
  app: Express,
  options: RegisterRoutesOptions = {},
): Promise<Server | undefined> {
  app.get("/api/academic-years", async (_req, res) => {
    try {
      const years = await storage.getAcademicYears();
      res.json(years);
    } catch (error) {
      res.status(500).json({ message: "Failed to load academic years" });
    }
  });

  app.post("/api/academic-years", async (req, res) => {
    try {
      const payload = createAcademicYearSchema.parse(req.body ?? {});
      const year = await storage.createAcademicYear(payload);
      res.status(201).json(year);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: (error as any)?.message || "Failed to create academic year" });
    }
  });

  // Students endpoint
  app.get("/api/students", async (req, res) => {
    try {
      const academicYear = typeof req.query.academicYear === "string" ? req.query.academicYear : undefined;
      const students = await storage.getStudents(academicYear);
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudent(id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.get("/api/students/:id/finance", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid student id" });
      }

      const academicYear = typeof req.query.academicYear === 'string' ? req.query.academicYear : undefined;
      const summary = await storage.getStudentFinanceSummary(id, academicYear);

      if (!summary) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: (error as any)?.message || "Failed to load student finance" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const validated = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validated);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.patch("/api/students/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid student id" });
      }

      const updateSchema = insertStudentSchema.partial();
      const payload = updateSchema.parse(req.body ?? {});
      const updated = await storage.updateStudent(id, payload);

      if (!updated) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid student id" });
      }

      const result = await storage.markStudentLeft(id);

      if (!result) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json({ message: "Student marked as left", student: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to update student status" });
    }
  });

  app.post("/api/students/:id/open-account", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid student id" });
      }

      const bodySchema = z.object({
        academicYear: z.string().optional(),
        reopen: z.boolean().optional(),
        isNewAdmission: z.boolean().optional(),
      });

      const payload = bodySchema.parse(req.body ?? {});
      const result = await storage.openStudentAccount(id, payload);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: (error as any)?.message || "Failed to open account" });
    }
  });

  app.get("/api/dues", async (req, res) => {
    const filterSchema = z.object({
      status: z.string().optional(),
      dueType: z.string().optional(),
      classId: z.coerce.number().optional(),
      studentId: z.coerce.number().optional(),
      month: z.string().optional(),
      academicYear: z.string().optional(),
    });

    try {
      const filters = filterSchema.parse(req.query);
      const dues = await storage.getStudentDues(filters);
      res.json(dues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid filters", errors: error.errors });
      }
      res.status(500).json({ message: (error as any)?.message || "Failed to fetch dues" });
    }
  });

  // Classes endpoint
  app.get("/api/classes", async (req, res) => {
    try {
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Database initialization endpoint - Create financial tables
  app.post("/api/init-database", async (req, res) => {
    try {
      await (storage as any).createFinancialTables();
      res.json({ message: 'Financial tables created successfully' });
    } catch (error) {
      console.error('Database initialization error:', error);
      res.status(500).json({ message: 'Failed to initialize database', error: error.message });
    }
  });

  // Fee Structures endpoints
  app.get("/api/fee-structures", async (req, res) => {
    try {
      const academicYear = req.query.academicYear as string;
      const feeStructures = await storage.getFeeStructures(academicYear);
      res.json(feeStructures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fee structures" });
    }
  });

  app.post("/api/fee-structures", async (req, res) => {
    try {
      const validatedData = insertFeeStructureSchema.parse(req.body);
      const feeStructure = await storage.createFeeStructure(validatedData);
      res.status(201).json(feeStructure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create fee structure" });
    }
  });

  // Student Fees endpoints
  app.get("/api/student-fees", async (req, res) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;
      const studentFees = await storage.getStudentFees(studentId, classId);
      res.json(studentFees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student fees" });
    }
  });

  app.post("/api/student-fees", async (req, res) => {
    try {
      const validatedData = insertStudentFeeSchema.parse(req.body);
      const studentFee = await storage.createStudentFee(validatedData);
      res.status(201).json(studentFee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student fee" });
    }
  });

  // Payments endpoints
  app.get("/api/payments", async (req, res) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const academicYear = typeof req.query.academicYear === "string" ? req.query.academicYear : undefined;
      const payments = await storage.getPayments(studentId, limit, academicYear);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/:id/receipt", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid payment id" });
      }
      const result = await storage.getPaymentWithAllocations(id);
      if (!result) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to load payment receipt" });
    }
  });

  app.post("/api/payments/record", async (req, res) => {
    try {
      const payload = recordPaymentSchema.parse(req.body ?? {});
      const result = await storage.recordPayment({
        studentId: payload.studentId,
        paymentDate: payload.paymentDate,
        paymentMethod: payload.paymentMethod,
        referenceNumber: payload.referenceNumber ?? null,
        remarks: payload.remarks ?? null,
        allocations: payload.allocations.map((allocation) => ({
          dueId: allocation.dueId,
        amount: allocation.amount,
        label: allocation.label,
        category: allocation.category,
        notes: allocation.notes,
      })),
        academicYear: payload.academicYear,
        verify: payload.verify,
        createdBy: payload.createdBy,
      });

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: (error as any)?.message || "Failed to record payment" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.patch("/api/payments/:id/verify", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { verifiedBy } = req.body;
      const payment = await storage.verifyPayment(id, verifiedBy);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Transport Fees endpoints
  app.get("/api/transport-fees", async (req, res) => {
    try {
      const academicYear = req.query.academicYear as string;
      const transportFees = await storage.getTransportFees(academicYear);
      res.json(transportFees);
    } catch (error) {
      console.error('Transport fees route error:', error);
      res.status(500).json({ message: "Failed to fetch transport fees" });
    }
  });

  app.post("/api/transport-fees", async (req, res) => {
    try {
      const validatedData = insertTransportFeeSchema.parse(req.body);
      const transportFee = await storage.createTransportFee(validatedData);
      res.status(201).json(transportFee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transport fee" });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const academicYear = (req.query.academicYear as string) || "2023-24";
      const stats = await storage.getDashboardStats(academicYear);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Collection trend endpoint
  app.get("/api/dashboard/collection-trend", async (req, res) => {
    try {
      const academicYear = (req.query.academicYear as string) || "2023-24";
      const trend = await storage.getCollectionTrend(academicYear);
      res.json(trend);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collection trend" });
    }
  });

  // Class-wise collections endpoint
  app.get("/api/dashboard/class-collections", async (req, res) => {
    try {
      const academicYear = (req.query.academicYear as string) || "2023-24";
      const collections = await storage.getClassCollections(academicYear);
      res.json(collections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch class collections" });
    }
  });

  // Fee structure overview endpoint
  app.get("/api/dashboard/fee-structure-overview", async (req, res) => {
    try {
      const academicYear = (req.query.academicYear as string) || "2023-24";
      const overview = await storage.getFeeStructureOverview(academicYear);
      res.json(overview);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fee structure overview" });
    }
  });

  // Excel import endpoint
  app.post("/api/excel-import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Read and parse the Excel file from buffer
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;
      
      let importedRecords = 0;
      let skippedRecords = 0;
      const errors: string[] = [];

      // Debug: Log all available sheet names
      console.log('Available sheets:', sheetNames);
      
      // Process class-wise sheets based on actual Excel file structure
      const classSheets = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'Nur', 'LKG', 'UKG'];
      const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      
      for (const className of classSheets) {
        if (sheetNames.includes(className)) {
          console.log(`Processing sheet: ${className}`);
          try {
            const classSheet = workbook.Sheets[className];
            const rawData = XLSX.utils.sheet_to_json(classSheet, {header: 1});
            
            // Find student data rows (starting from row index 3, after headers)
            for (let rowIndex = 3; rowIndex < rawData.length; rowIndex++) {
              const row = rawData[rowIndex];
              if (!row || !row[0] || !row[1]) continue; // Skip empty rows
              
              try {
                const ledgerNo = row[0];
                const studentName = String(row[1] || '').trim();
                const fatherName = String(row[2] || '').trim();
                const phoneNo = String(row[3] || '').trim();
                const admissionType = String(row[4] || '').trim();
                
                if (!studentName) continue; // Skip if no student name
                
                // Process monthly fee payments (columns 5-16 for Apr-Mar)
                for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
                  const monthValue = row[5 + monthIndex];
                  if (monthValue && typeof monthValue === 'number' && monthValue > 0) {
                    try {
                      // Calculate proper academic year dates
                      const academicYear = '2024-25';
                      let paymentYear = 2024;
                      let paymentMonth = monthIndex + 4; // Apr=4, May=5, etc.
                      
                      // Handle academic year transition (Jan-Mar are in next calendar year)
                      if (monthIndex >= 9) { // Jan=9, Feb=10, Mar=11 in our months array
                        paymentYear = 2025;
                        paymentMonth = monthIndex - 8; // Jan=1, Feb=2, Mar=3
                      }
                      
                      // Create a safe student ID using ledger number if available, otherwise use a unique identifier
                      // This ensures payments can be tracked even if student records don't exist yet
                      const studentId = ledgerNo || `excel-${className}-${rowIndex}`;
                      
                      // Check for duplicate transaction to prevent re-imports
                      const duplicateCheck = `${academicYear}-${className}-${studentId}-${months[monthIndex]}`;
                      // For now, we'll process all - deduplication can be added later
                      
                      const paymentData = {
                        studentId: studentId,
                        amount: monthValue.toString(),
                        paymentMethod: 'cash',
                        transactionId: duplicateCheck,
                        paymentDate: new Date(paymentYear, paymentMonth - 1, 1), // Proper date construction
                        status: 'paid',
                        remarks: `Monthly fee for ${studentName} (${className}) - ${months[monthIndex]} ${academicYear}`,
                        studentName,
                        className,
                        month: months[monthIndex],
                        academicYear,
                        admissionType
                      };
                      
                      // Create actual payment record in database
                      await storage.createPayment(paymentData);
                      importedRecords++;
                      
                    } catch (error) {
                      skippedRecords++;
                      errors.push(`${className} Row ${rowIndex + 1} ${months[monthIndex]}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }
                }
              } catch (error) {
                skippedRecords++;
                errors.push(`${className} Row ${rowIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          } catch (error) {
            errors.push(`Failed to process ${className} sheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Skip excel_imports table for now - just return success
      console.log(`Excel import completed: ${importedRecords} imported, ${skippedRecords} skipped`);

      // No need to clean up - using memory storage

      res.status(201).json({
        message: `Import completed: ${importedRecords} records imported, ${skippedRecords} skipped`,
        sheetsProcessed: sheetNames.length,
        recordsImported: importedRecords,
        recordsSkipped: skippedRecords,
        importStatus: errors.length === 0 ? 'completed' : 'completed_with_errors',
        errors: errors.length > 0 ? errors : null,
        availableSheets: sheetNames,
        lookingForSheets: classSheets
      });

    } catch (error) {
      console.error('Excel import error:', error);
      
      // Clean up file if it exists
      if (req.file) {
        try {
          require('fs').unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('Failed to clean up uploaded file:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        message: "Failed to process Excel file", 
        error: error.message 
      });
    }
  });

  // Pending actions endpoint
  app.get("/api/dashboard/pending-actions", async (req, res) => {
    try {
      const actions = await storage.getPendingActions();
      res.json(actions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending actions" });
    }
  });

  if (options.createHttpServer === false) {
    return undefined;
  }

  const httpServer = createServer(app);
  return httpServer;
}
