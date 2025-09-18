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
  uniqueIndex,
  time,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import existing enums from your MeedianAI-Flow schema
export const roleEnum = pgEnum("role", ["admin", "team_manager", "member"]);
export const teamManagerTypeEnum = pgEnum("team_manager_type", [
  "head_incharge",
  "coordinator",
  "accountant",
  "chief_counsellor",
  "hostel_incharge",
  "principal",
]);
export const userTypeEnum = pgEnum("user_type", ["residential", "non_residential", "semi_residential"]);
export const memberScopeEnum = pgEnum("member_scope", ["o_member", "i_member", "s_member"]);

// Existing users table (exactly as in your MeedianAI-Flow schema)
export const users: any = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  whatsapp_number: varchar("whatsapp_number", { length: 15 }),
  whatsapp_enabled: boolean("whatsapp_enabled").default(true).notNull(),
  role: roleEnum("role").default("member").notNull(),
  team_manager_type: teamManagerTypeEnum("team_manager_type"),
  type: userTypeEnum("type").default("residential").notNull(),
  member_scope: memberScopeEnum("member_scope").default("i_member").notNull(),
  image: text("image"),
  deep_calendar_token: text("deep_calendar_token").unique(),
  immediate_supervisor: integer("immediate_supervisor").references(() => users.id, { onDelete: "set null" }),
  isTeacher: boolean("is_teacher"),
}, (table) => ({
  idx_whatsapp_number: index("idx_users_whatsapp_number").on(table.whatsapp_number),
  idx_email: index("idx_users_email").on(table.email),
}));

// Existing classes table (exactly as in your MeedianAI-Flow schema)
export const Classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  section: varchar("section", { length: 8 }),
  track: varchar("track", { length: 32 }), // 'pre_primary' | 'elementary'
  active: boolean("active").default(true).notNull(),
}, (t) => ({
  idx_classes_name: index("idx_classes_name").on(t.name),
  uniq_name_section_track: uniqueIndex("uniq_classes_name_section_track").on(t.name, t.section, t.track),
}));

// Create alias for compatibility
export const classes = Classes;

// Existing students table (exactly as in your MeedianAI-Flow schema)
export const Students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  admissionNumber: varchar("admission_number", { length: 50 }).unique(),
  admissionDate: timestamp("admission_date"),
  aadharNumber: varchar("aadhar_number", { length: 20 }),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender", { length: 10 }),
  classId: integer("class_id").notNull().references(() => Classes.id, { onDelete: "restrict" }),
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
  notes: jsonb("notes").default(JSON.stringify([])),
}, (t) => ({
  idxClass: index("students_class_idx").on(t.classId),
  idxAdmNo: index("students_admno_idx").on(t.admissionNumber),
}));

// Create alias for compatibility
export const students = Students;

// New Finance-specific tables and enums

// Fee structure enums
export const feeTypeEnum = pgEnum("fee_type", [
  "tuition",
  "admission", 
  "examination",
  "sports",
  "library",
  "computer",
  "transport", 
  "hostel",
  "miscellaneous"
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
  "paid", 
  "failed", 
  "partial"
]);

// Fee structures by class and type
export const feeStructures = pgTable("fee_structures", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => Classes.id, { onDelete: "cascade" }),
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
  studentId: integer("student_id").notNull().references(() => Students.id, { onDelete: "cascade" }),
  feeStructureId: integer("fee_structure_id").notNull().references(() => feeStructures.id, { onDelete: "cascade" }),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  dueAmount: decimal("due_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  pendingAmount: decimal("pending_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  dueDate: timestamp("due_date"),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  idx_student_year: index("idx_student_fees_student_year").on(t.studentId, t.academicYear),
  uniq_student_fee_structure: uniqueIndex("uniq_student_fee_structure").on(t.studentId, t.feeStructureId, t.academicYear),
}));

// Payment records
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => Students.id, { onDelete: "cascade" }),
  studentFeeId: integer("student_fee_id").references(() => studentFees.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  transactionId: varchar("transaction_id", { length: 100 }),
  paymentDate: timestamp("payment_date").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  verifiedBy: integer("verified_by").references(() => users.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at"),
  remarks: text("remarks"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  idx_student_date: index("idx_payments_student_date").on(t.studentId, t.paymentDate),
  idx_status: index("idx_payments_status").on(t.status),
}));

// Transport fee management
export const transportFees = pgTable("transport_fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => Students.id, { onDelete: "cascade" }),
  routeName: varchar("route_name", { length: 100 }).notNull(),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull(),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  effectiveDate: date("effective_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  idx_student_year: index("idx_transport_fees_student_year").on(t.studentId, t.academicYear),
}));

// Financial reports and analytics
export const financialReports = pgTable("financial_reports", {
  id: serial("id").primaryKey(),
  reportType: varchar("report_type", { length: 50 }).notNull(),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  classId: integer("class_id").references(() => Classes.id),
  reportData: jsonb("report_data").notNull(),
  generatedBy: integer("generated_by").notNull().references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
}, (t) => ({
  idx_type_year: index("idx_financial_reports_type_year").on(t.reportType, t.academicYear),
}));

// Excel import tracking
export const excelImports = pgTable("excel_imports", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  importType: varchar("import_type", { length: 50 }).notNull(),
  totalRecords: integer("total_records").notNull(),
  successfulRecords: integer("successful_records").notNull(),
  failedRecords: integer("failed_records").notNull(),
  errorLog: jsonb("error_log"),
  importedBy: integer("imported_by").notNull().references(() => users.id),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
}, (t) => ({
  idx_imported_by_date: index("idx_excel_imports_by_date").on(t.importedBy, t.importedAt),
}));

// Create insert schemas for forms
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertStudentSchema = createInsertSchema(Students).omit({
  id: true,
  createdAt: true,
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
export type Class = typeof Classes.$inferSelect;
export type Student = typeof Students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
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