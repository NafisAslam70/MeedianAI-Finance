import { sql, relations } from "drizzle-orm";
import { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  integer, 
  boolean, 
  timestamp, 
  decimal,
  date,
  pgEnum,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Existing users table (shared with MeedianAI-Flow)
export const users: any = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  whatsapp_number: varchar("whatsapp_number", { length: 15 }),
  whatsapp_enabled: boolean("whatsapp_enabled").default(true).notNull(),
  role: varchar("role", { length: 50 }).default("member").notNull(),
  team_manager_type: varchar("team_manager_type", { length: 50 }),
  type: varchar("type", { length: 50 }).default("residential").notNull(),
  member_scope: varchar("member_scope", { length: 50 }).default("i_member").notNull(),
  image: text("image"),
  deep_calendar_token: text("deep_calendar_token").unique(),
  immediate_supervisor: integer("immediate_supervisor").references(() => users.id, { onDelete: "set null" }),
  isTeacher: boolean("is_teacher"),
}, (table) => ({
  idx_whatsapp_number: index("idx_users_whatsapp_number").on(table.whatsapp_number),
  idx_email: index("idx_users_email").on(table.email),
}));

// Existing classes table (shared with MeedianAI-Flow)
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  section: varchar("section", { length: 8 }),
  track: varchar("track", { length: 32 }),
  active: boolean("active").default(true).notNull(),
}, (t) => ({
  idx_classes_name: index("idx_classes_name").on(t.name),
  uniq_name_section_track: uniqueIndex("uniq_classes_name_section_track").on(t.name, t.section, t.track),
}));

// Existing students table (shared with MeedianAI-Flow)
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  admissionNumber: varchar("admission_number", { length: 50 }).unique(),
  admissionDate: timestamp("admission_date"),
  aadharNumber: varchar("aadhar_number", { length: 20 }),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender", { length: 10 }),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "restrict" }),
  sectionType: varchar("section_type", { length: 20 }),
  isHosteller: boolean("is_hosteller").default(false),
  transportChosen: boolean("transport_chosen").default(false),
  guardianPhone: varchar("guardian_phone", { length: 20 }),
  guardianName: varchar("guardian_name", { length: 255 }),
  guardianWhatsappNumber: varchar("guardian_whatsapp_number", { length: 20 }),
  motherName: varchar("mother_name", { length: 255 }),
  address: varchar("address", { length: 255 }),
  bloodGroup: varchar("blood_group", { length: 10 }),
  feeStatus: varchar("fee_status", { length: 20 }).default("Pending"),
  status: varchar("status", { length: 20 }).default("active"),
  accountOpened: boolean("account_opened").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  notes: text("notes"),
}, (t) => ({
  idxClass: index("students_class_idx").on(t.classId),
  idxAdmNo: index("students_admno_idx").on(t.admissionNumber),
}));

// New Finance-specific tables

// Fee structure enums
export const feeTypeEnum = pgEnum("fee_type", [
  "monthly", 
  "admission", 
  "transport", 
  "supply", 
  "other"
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash", 
  "upi", 
  "bank_transfer", 
  "cheque", 
  "online"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending", 
  "verified", 
  "rejected", 
  "partial"
]);

// Fee structures by class and type
export const feeStructures = pgTable("fee_structures", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  feeType: feeTypeEnum("fee_type").notNull(),
  hostellerAmount: decimal("hosteller_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  dayScholarAmount: decimal("day_scholar_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  idx_class_year: index("idx_fee_structures_class_year").on(t.classId, t.academicYear),
  uniq_class_year_type: uniqueIndex("uniq_fee_structures_class_year_type").on(t.classId, t.academicYear, t.feeType),
}));

// Individual student fee accounts
export const studentFees = pgTable("student_fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  feeStructureId: integer("fee_structure_id").notNull().references(() => feeStructures.id, { onDelete: "cascade" }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  dueAmount: decimal("due_amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  status: paymentStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  idx_student: index("idx_student_fees_student").on(t.studentId),
  idx_structure: index("idx_student_fees_structure").on(t.feeStructureId),
  uniq_student_structure: uniqueIndex("uniq_student_fees_student_structure").on(t.studentId, t.feeStructureId),
}));

// Payment transactions
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  studentFeeId: integer("student_fee_id").references(() => studentFees.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  referenceNumber: varchar("reference_number", { length: 100 }),
  remarks: text("remarks"),
  status: paymentStatusEnum("status").default("pending").notNull(),
  verifiedBy: integer("verified_by").references(() => users.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  idx_student: index("idx_payments_student").on(t.studentId),
  idx_date: index("idx_payments_date").on(t.paymentDate),
  idx_status: index("idx_payments_status").on(t.status),
}));

// Transport fee management
export const transportFees = pgTable("transport_fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  routeName: varchar("route_name", { length: 100 }).notNull(),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull(),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  idx_student: index("idx_transport_fees_student").on(t.studentId),
  idx_year: index("idx_transport_fees_year").on(t.academicYear),
}));

// Financial reports and summaries
export const financialReports = pgTable("financial_reports", {
  id: serial("id").primaryKey(),
  reportType: varchar("report_type", { length: 50 }).notNull(),
  reportPeriod: varchar("report_period", { length: 50 }).notNull(),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  totalExpected: decimal("total_expected", { precision: 12, scale: 2 }).notNull(),
  totalCollected: decimal("total_collected", { precision: 12, scale: 2 }).notNull(),
  totalOutstanding: decimal("total_outstanding", { precision: 12, scale: 2 }).notNull(),
  reportData: text("report_data"), // JSON data
  generatedBy: integer("generated_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
}, (t) => ({
  idx_type_period: index("idx_financial_reports_type_period").on(t.reportType, t.reportPeriod),
  idx_year: index("idx_financial_reports_year").on(t.academicYear),
}));

// Excel import logs
export const excelImports = pgTable("excel_imports", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  sheetsProcessed: integer("sheets_processed").notNull(),
  recordsImported: integer("records_imported").notNull(),
  recordsSkipped: integer("records_skipped").default(0).notNull(),
  importStatus: varchar("import_status", { length: 20 }).default("processing").notNull(),
  errorLog: text("error_log"),
  importedBy: integer("imported_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
}, (t) => ({
  idx_status: index("idx_excel_imports_status").on(t.importStatus),
  idx_imported_by: index("idx_excel_imports_imported_by").on(t.importedBy),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  payments: many(payments, { relationName: "PaymentCreatedBy" }),
  verifiedPayments: many(payments, { relationName: "PaymentVerifiedBy" }),
  financialReports: many(financialReports),
  excelImports: many(excelImports),
}));

export const classesRelations = relations(classes, ({ many }) => ({
  students: many(students),
  feeStructures: many(feeStructures),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
  studentFees: many(studentFees),
  payments: many(payments),
  transportFees: many(transportFees),
}));

export const feeStructuresRelations = relations(feeStructures, ({ one, many }) => ({
  class: one(classes, {
    fields: [feeStructures.classId],
    references: [classes.id],
  }),
  studentFees: many(studentFees),
}));

export const studentFeesRelations = relations(studentFees, ({ one, many }) => ({
  student: one(students, {
    fields: [studentFees.studentId],
    references: [students.id],
  }),
  feeStructure: one(feeStructures, {
    fields: [studentFees.feeStructureId],
    references: [feeStructures.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
  studentFee: one(studentFees, {
    fields: [payments.studentFeeId],
    references: [studentFees.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
    relationName: "PaymentCreatedBy",
  }),
  verifiedBy: one(users, {
    fields: [payments.verifiedBy],
    references: [users.id],
    relationName: "PaymentVerifiedBy",
  }),
}));

export const transportFeesRelations = relations(transportFees, ({ one }) => ({
  student: one(students, {
    fields: [transportFees.studentId],
    references: [students.id],
  }),
}));

export const financialReportsRelations = relations(financialReports, ({ one }) => ({
  generatedBy: one(users, {
    fields: [financialReports.generatedBy],
    references: [users.id],
  }),
}));

export const excelImportsRelations = relations(excelImports, ({ one }) => ({
  importedBy: one(users, {
    fields: [excelImports.importedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
});

export const insertFeeStructureSchema = createInsertSchema(feeStructures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentFeeSchema = createInsertSchema(studentFees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export const insertTransportFeeSchema = createInsertSchema(transportFees).omit({
  id: true,
  createdAt: true,
});

export const insertFinancialReportSchema = createInsertSchema(financialReports).omit({
  id: true,
  generatedAt: true,
});

export const insertExcelImportSchema = createInsertSchema(excelImports).omit({
  id: true,
  importedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Class = typeof classes.$inferSelect;
export type Student = typeof students.$inferSelect;
export type FeeStructure = typeof feeStructures.$inferSelect;
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;
export type StudentFee = typeof studentFees.$inferSelect;
export type InsertStudentFee = z.infer<typeof insertStudentFeeSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type TransportFee = typeof transportFees.$inferSelect;
export type InsertTransportFee = z.infer<typeof insertTransportFeeSchema>;
export type FinancialReport = typeof financialReports.$inferSelect;
export type InsertFinancialReport = z.infer<typeof insertFinancialReportSchema>;
export type ExcelImport = typeof excelImports.$inferSelect;
export type InsertExcelImport = z.infer<typeof insertExcelImportSchema>;
