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

export async function registerRoutes(app: Express): Promise<Server> {
  // Students endpoint
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getStudents();
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
      const payments = await storage.getPayments(studentId, limit);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
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

      // Process Students sheet if it exists
      if (sheetNames.includes('Students')) {
        try {
          const studentsSheet = workbook.Sheets['Students'];
          const studentsData = XLSX.utils.sheet_to_json(studentsSheet);
          
          for (const [index, row] of studentsData.entries()) {
            try {
              const studentData = {
                name: String(row['Name'] || '').trim(),
                email: String(row['Email'] || '').trim(),
                phone: String(row['Phone'] || '').trim(),
                admissionNumber: String(row['Admission Number'] || '').trim(),
                classId: Number(row['Class ID']) || 1,
                guardianName: String(row['Guardian Name'] || '').trim(),
                guardianPhone: String(row['Guardian Phone'] || '').trim()
              };

              if (studentData.name && studentData.email) {
                await storage.createStudent(studentData);
                importedRecords++;
              } else {
                skippedRecords++;
                errors.push(`Row ${index + 2} in Students: Missing required fields (Name, Email)`);
              }
            } catch (error) {
              skippedRecords++;
              errors.push(`Row ${index + 2} in Students: ${error.message}`);
            }
          }
        } catch (error) {
          errors.push(`Failed to process Students sheet: ${error.message}`);
        }
      }

      // Process Payments sheet if it exists
      if (sheetNames.includes('Payments')) {
        try {
          const paymentsSheet = workbook.Sheets['Payments'];
          const paymentsData = XLSX.utils.sheet_to_json(paymentsSheet);
          
          for (const [index, row] of paymentsData.entries()) {
            try {
              const paymentData = {
                studentId: Number(row['Student ID']) || 1,
                amount: Number(row['Amount']) || 0,
                feeType: String(row['Fee Type'] || 'monthly').toLowerCase(),
                academicYear: String(row['Academic Year'] || '2023-24'),
                month: String(row['Month'] || 'January'),
                paymentMethod: String(row['Payment Method'] || 'cash').toLowerCase(),
                transactionId: String(row['Transaction ID'] || ''),
                paymentDate: new Date(row['Payment Date'] || new Date()),
                remarks: String(row['Remarks'] || '').trim()
              };

              if (paymentData.amount > 0) {
                // Create payment using raw SQL to handle schema mismatch
                await storage.createPayment(paymentData);
                importedRecords++;
              } else {
                skippedRecords++;
                errors.push(`Row ${index + 2} in Payments: Invalid amount`);
              }
            } catch (error) {
              skippedRecords++;
              errors.push(`Row ${index + 2} in Payments: ${error.message}`);
            }
          }
        } catch (error) {
          errors.push(`Failed to process Payments sheet: ${error.message}`);
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
        errors: errors.length > 0 ? errors : null
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

  const httpServer = createServer(app);
  return httpServer;
}
