import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPaymentSchema, insertFeeStructureSchema, insertStudentFeeSchema, insertTransportFeeSchema, insertExcelImportSchema } from "@shared/schema";
import { z } from "zod";

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
      const student = await storage.createStudent(req.body);
      res.status(201).json(student);
    } catch (error) {
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
  app.post("/api/excel-import", async (req, res) => {
    try {
      const validatedData = insertExcelImportSchema.parse(req.body);
      const importRecord = await storage.createExcelImport(validatedData);
      res.status(201).json(importRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create excel import" });
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
