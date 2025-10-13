import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  date,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const feeTypeEnum = pgEnum("fee_type", [
  "tuition",
  "admission",
  "examination",
  "sports",
  "library",
  "computer",
  "transport",
  "hostel",
  "miscellaneous",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "upi",
  "bank",
  "bank_transfer",
  "cheque",
  "online",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "partial",
]);

export const accountStatusEnum = pgEnum("account_status", [
  "open",
  "closed",
]);

export const dueTypeEnum = pgEnum("due_type", [
  "one_time",
  "monthly",
]);

export const dueItemEnum = pgEnum("due_item", [
  "admission",
  "registration",
  "uniform",
  "copy",
  "book",
  "hst_dress",
  "monthly",
  "misc",
]);

export const dueStatusEnum = pgEnum("due_status", [
  "due",
  "partial",
  "paid",
]);

export const academicYears = pgTable(
  "academic_years",
  {
    code: varchar("code", { length: 20 }).primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    startDate: date("start_date"),
    endDate: date("end_date"),
    isActive: boolean("is_active").default(true).notNull(),
    isCurrent: boolean("is_current").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniq_academic_years_name: uniqueIndex("uniq_academic_years_name").on(table.name),
    idx_academic_years_current: index("idx_academic_years_current").on(table.isCurrent),
  }),
);

export const feeStructures = pgTable(
  "fee_structures",
  {
    id: serial("id").primaryKey(),
    classId: integer("class_id").notNull(),
    academicYear: varchar("academic_year", { length: 20 })
      .references(() => academicYears.code, { onDelete: "restrict" }),
    feeType: feeTypeEnum("fee_type").notNull(),
    hostellerAmount: decimal("hosteller_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    dayScholarAmount: decimal("day_scholar_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    idx_class_year: index("idx_fee_structures_class_year").on(t.classId, t.academicYear),
    uniq_class_year_type: uniqueIndex("uniq_fee_structures_class_year_type").on(
      t.classId,
      t.academicYear,
      t.feeType,
    ),
  }),
);

export const studentFees = pgTable(
  "student_fees",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id").notNull(),
    feeStructureId: integer("fee_structure_id").notNull(),
    academicYear: varchar("academic_year", { length: 20 })
      .references(() => academicYears.code, { onDelete: "restrict" }),
    dueAmount: decimal("due_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    pendingAmount: decimal("pending_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    dueDate: timestamp("due_date"),
    status: varchar("status", { length: 20 }).default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    idx_student_year: index("idx_student_fees_student_year").on(t.studentId, t.academicYear),
    uniq_student_fee_structure: uniqueIndex("uniq_student_fee_structure").on(
      t.studentId,
      t.feeStructureId,
      t.academicYear,
    ),
  }),
);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  studentFeeId: integer("student_fee_id"),
  academicYear: varchar("academic_year", { length: 20 })
    .references(() => academicYears.code, { onDelete: "restrict" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  transactionId: varchar("transaction_id", { length: 100 }),
  paymentDate: timestamp("payment_date").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  verifiedBy: integer("verified_by"),
  verifiedAt: timestamp("verified_at"),
  remarks: text("remarks"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transportFees = pgTable("transport_fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  routeName: varchar("route_name", { length: 100 }).notNull(),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull(),
  academicYear: varchar("academic_year", { length: 20 })
    .references(() => academicYears.code, { onDelete: "restrict" }),
  effectiveDate: date("effective_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const financialReports = pgTable(
  "financial_reports",
  {
    id: serial("id").primaryKey(),
    reportType: varchar("report_type", { length: 50 }).notNull(),
    academicYear: varchar("academic_year", { length: 20 })
      .references(() => academicYears.code, { onDelete: "restrict" }),
    classId: integer("class_id"),
    reportData: jsonb("report_data").notNull(),
    generatedBy: integer("generated_by").notNull(),
    generatedAt: timestamp("generated_at").defaultNow().notNull(),
  },
  (t) => ({
    idx_type_year: index("idx_financial_reports_type_year").on(t.reportType, t.academicYear),
  }),
);

export const excelImports = pgTable(
  "excel_imports",
  {
    id: serial("id").primaryKey(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    importType: varchar("import_type", { length: 50 }).notNull(),
    totalRecords: integer("total_records").notNull(),
    successfulRecords: integer("successful_records").notNull(),
    failedRecords: integer("failed_records").notNull(),
    errorLog: jsonb("error_log"),
    importedBy: integer("imported_by").notNull(),
    importedAt: timestamp("imported_at").defaultNow().notNull(),
  },
  (t) => ({
    idx_imported_by_date: index("idx_excel_imports_by_date").on(t.importedBy, t.importedAt),
  }),
);

export const studentAccounts = pgTable(
  "student_accounts",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id").notNull(),
    ledgerNumber: varchar("ledger_number", { length: 50 }).notNull().unique(),
    status: accountStatusEnum("status").default("open").notNull(),
    academicYear: varchar("academic_year", { length: 20 })
      .references(() => academicYears.code, { onDelete: "restrict" }),
    openedAt: timestamp("opened_at").defaultNow().notNull(),
    closedAt: timestamp("closed_at"),
  },
  (t) => ({
    idx_student_accounts_student: index("idx_student_accounts_student").on(t.studentId),
  }),
);

export const studentDues = pgTable(
  "student_dues",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id").notNull(),
    accountId: integer("account_id").notNull(),
    dueType: dueTypeEnum("due_type").notNull(),
    itemType: dueItemEnum("item_type").notNull(),
    academicYear: varchar("academic_year", { length: 20 })
      .references(() => academicYears.code, { onDelete: "restrict" }),
    dueMonth: varchar("due_month", { length: 20 }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0").notNull(),
    status: dueStatusEnum("status").default("due").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    idx_student_dues_student: index("idx_student_dues_student").on(t.studentId),
    idx_student_dues_account: index("idx_student_dues_account").on(t.accountId),
    idx_student_dues_status: index("idx_student_dues_status").on(t.status),
  }),
);

export const paymentAllocations = pgTable("payment_allocations", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }),
  dueId: integer("due_id").references(() => studentDues.id, { onDelete: "set null" }),
  label: varchar("label", { length: 120 }),
  category: varchar("category", { length: 60 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const financeSchema = {
  academicYears,
  feeStructures,
  studentFees,
  payments,
  transportFees,
  financialReports,
  excelImports,
};

export const extendedFinanceSchema = {
  ...financeSchema,
  studentAccounts,
  studentDues,
  paymentAllocations,
};

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

export const insertAcademicYearSchema = createInsertSchema(academicYears).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertStudentAccountSchema = createInsertSchema(studentAccounts).omit({
  id: true,
  openedAt: true,
  closedAt: true,
});

export const insertStudentDueSchema = createInsertSchema(studentDues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentAllocationSchema = createInsertSchema(paymentAllocations).omit({
  id: true,
  createdAt: true,
});

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

export type AcademicYear = typeof academicYears.$inferSelect;
export type InsertAcademicYear = z.infer<typeof insertAcademicYearSchema>;

export type StudentAccount = typeof studentAccounts.$inferSelect;
export type InsertStudentAccount = z.infer<typeof insertStudentAccountSchema>;

export type StudentDue = typeof studentDues.$inferSelect;
export type InsertStudentDue = z.infer<typeof insertStudentDueSchema>;
export type PaymentAllocation = typeof paymentAllocations.$inferSelect;
export type InsertPaymentAllocation = z.infer<typeof insertPaymentAllocationSchema>;
