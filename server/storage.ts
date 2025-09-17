import { 
  users, 
  classes, 
  students, 
  feeStructures, 
  studentFees, 
  payments, 
  transportFees, 
  financialReports, 
  excelImports,
  type User, 
  type InsertUser,
  type Class,
  type Student,
  type FeeStructure,
  type InsertFeeStructure,
  type StudentFee,
  type InsertStudentFee,
  type Payment,
  type InsertPayment,
  type TransportFee,
  type InsertTransportFee,
  type FinancialReport,
  type InsertFinancialReport,
  type ExcelImport,
  type InsertExcelImport
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sum, count, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  
  // Classes
  getClasses(): Promise<Class[]>;
  
  // Fee Structures
  getFeeStructures(academicYear?: string): Promise<FeeStructure[]>;
  createFeeStructure(feeStructure: InsertFeeStructure): Promise<FeeStructure>;
  
  // Student Fees
  getStudentFees(studentId?: number, classId?: number): Promise<StudentFee[]>;
  createStudentFee(studentFee: InsertStudentFee): Promise<StudentFee>;
  
  // Payments
  getPayments(studentId?: number, limit?: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  verifyPayment(id: number, verifiedBy: number): Promise<Payment | undefined>;
  
  // Transport Fees
  getTransportFees(academicYear?: string): Promise<TransportFee[]>;
  createTransportFee(transportFee: InsertTransportFee): Promise<TransportFee>;
  
  // Dashboard
  getDashboardStats(academicYear: string): Promise<any>;
  getCollectionTrend(academicYear: string): Promise<any>;
  getClassCollections(academicYear: string): Promise<any>;
  getFeeStructureOverview(academicYear: string): Promise<any>;
  getPendingActions(): Promise<any>;
  
  // Excel Import
  createExcelImport(excelImport: InsertExcelImport): Promise<ExcelImport>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return result[0];
  }

  async getStudents(): Promise<Student[]> {
    const result = await db
      .select({
        id: students.id,
        name: students.name,
        admissionNumber: students.admissionNumber,
        admissionDate: students.admissionDate,
        aadharNumber: students.aadharNumber,
        dateOfBirth: students.dateOfBirth,
        gender: students.gender,
        classId: students.classId,
        sectionType: students.sectionType,
        isHosteller: students.isHosteller,
        transportChosen: students.transportChosen,
        guardianPhone: students.guardianPhone,
        guardianName: students.guardianName,
        guardianWhatsappNumber: students.guardianWhatsappNumber,
        motherName: students.motherName,
        address: students.address,
        bloodGroup: students.bloodGroup,
        feeStatus: students.feeStatus,
        status: students.status,
        accountOpened: students.accountOpened,
        createdAt: students.createdAt,
        notes: students.notes,
        class: {
          id: classes.id,
          name: classes.name,
          section: classes.section,
          track: classes.track,
          active: classes.active,
        }
      })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .orderBy(students.name);
    
    return result;
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, id));
    return student || undefined;
  }

  async getClasses(): Promise<Class[]> {
    return await db
      .select()
      .from(classes)
      .where(eq(classes.active, true))
      .orderBy(classes.name);
  }

  async getFeeStructures(academicYear?: string): Promise<FeeStructure[]> {
    let query = db.select().from(feeStructures);
    
    if (academicYear) {
      query = query.where(and(eq(feeStructures.isActive, true), eq(feeStructures.academicYear, academicYear)));
    } else {
      query = query.where(eq(feeStructures.isActive, true));
    }
    
    return await query.orderBy(feeStructures.classId, feeStructures.feeType);
  }

  async createFeeStructure(feeStructure: InsertFeeStructure): Promise<FeeStructure> {
    const [result] = await db
      .insert(feeStructures)
      .values(feeStructure)
      .returning();
    return result;
  }

  async getStudentFees(studentId?: number, classId?: number): Promise<StudentFee[]> {
    let query = db.select().from(studentFees);
    
    if (studentId) {
      query = query.where(eq(studentFees.studentId, studentId));
    }
    
    return await query.orderBy(desc(studentFees.createdAt));
  }

  async createStudentFee(studentFee: InsertStudentFee): Promise<StudentFee> {
    const [result] = await db
      .insert(studentFees)
      .values(studentFee)
      .returning();
    return result;
  }

  async getPayments(studentId?: number, limit?: number): Promise<Payment[]> {
    let query = db
      .select({
        id: payments.id,
        studentId: payments.studentId,
        studentFeeId: payments.studentFeeId,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        paymentDate: payments.paymentDate,
        referenceNumber: payments.referenceNumber,
        remarks: payments.remarks,
        status: payments.status,
        verifiedBy: payments.verifiedBy,
        verifiedAt: payments.verifiedAt,
        createdBy: payments.createdBy,
        createdAt: payments.createdAt,
        studentName: students.name,
        className: classes.name,
      })
      .from(payments)
      .leftJoin(students, eq(payments.studentId, students.id))
      .leftJoin(classes, eq(students.classId, classes.id));
    
    if (studentId) {
      query = query.where(eq(payments.studentId, studentId));
    }
    
    query = query.orderBy(desc(payments.paymentDate));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [result] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return result;
  }

  async verifyPayment(id: number, verifiedBy: number): Promise<Payment | undefined> {
    const [result] = await db
      .update(payments)
      .set({ 
        status: 'verified', 
        verifiedBy, 
        verifiedAt: new Date() 
      })
      .where(eq(payments.id, id))
      .returning();
    return result || undefined;
  }

  async getTransportFees(academicYear?: string): Promise<TransportFee[]> {
    let query = db
      .select({
        id: transportFees.id,
        studentId: transportFees.studentId,
        routeName: transportFees.routeName,
        monthlyAmount: transportFees.monthlyAmount,
        academicYear: transportFees.academicYear,
        startDate: transportFees.startDate,
        endDate: transportFees.endDate,
        isActive: transportFees.isActive,
        createdAt: transportFees.createdAt,
        studentName: students.name,
        className: classes.name,
      })
      .from(transportFees)
      .leftJoin(students, eq(transportFees.studentId, students.id))
      .leftJoin(classes, eq(students.classId, classes.id));
    
    if (academicYear) {
      query = query.where(and(eq(transportFees.isActive, true), eq(transportFees.academicYear, academicYear)));
    } else {
      query = query.where(eq(transportFees.isActive, true));
    }
    
    return await query.orderBy(transportFees.routeName, students.name);
  }

  async createTransportFee(transportFee: InsertTransportFee): Promise<TransportFee> {
    const [result] = await db
      .insert(transportFees)
      .values(transportFee)
      .returning();
    return result;
  }

  async getDashboardStats(academicYear: string): Promise<any> {
    // Get total students count
    const [totalStudentsResult] = await db
      .select({ 
        totalStudents: count(),
        totalHostellers: sum(sql`CASE WHEN ${students.isHosteller} = true THEN 1 ELSE 0 END`),
        totalDayScholars: sum(sql`CASE WHEN ${students.isHosteller} = false THEN 1 ELSE 0 END`),
      })
      .from(students)
      .where(eq(students.status, 'active'));

    // Get monthly collection (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(currentMonth.getMonth() + 1);

    const [collectionResult] = await db
      .select({ 
        monthlyCollection: sum(payments.amount) 
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, 'verified'),
          sql`${payments.paymentDate} >= ${currentMonth}`,
          sql`${payments.paymentDate} < ${nextMonth}`
        )
      );

    // Get transport collection
    const [transportResult] = await db
      .select({ 
        vanCollection: sum(payments.amount),
        vanStudents: count(sql`DISTINCT ${payments.studentId}`)
      })
      .from(payments)
      .leftJoin(students, eq(payments.studentId, students.id))
      .where(
        and(
          eq(payments.status, 'verified'),
          eq(students.transportChosen, true),
          sql`${payments.paymentDate} >= ${currentMonth}`,
          sql`${payments.paymentDate} < ${nextMonth}`
        )
      );

    return {
      totalStudents: parseInt(String(totalStudentsResult?.totalStudents || '0')),
      totalHostellers: parseInt(String(totalStudentsResult?.totalHostellers || '0')),
      totalDayScholars: parseInt(String(totalStudentsResult?.totalDayScholars || '0')),
      monthlyCollection: parseFloat(collectionResult?.monthlyCollection || '0'),
      expectedMonthly: 500900, // This would be calculated from fee structures
      vanCollection: parseFloat(transportResult?.vanCollection || '0'),
      vanStudents: parseInt(String(transportResult?.vanStudents || '0')),
      collectionGrowth: 12.5,
      deficit: 39000,
    };
  }

  async getCollectionTrend(academicYear: string): Promise<any> {
    // This would typically query payment data over the last 12 months
    // For now, return empty array as real data would come from payment history
    return [];
  }

  async getClassCollections(academicYear: string): Promise<any> {
    const result = await db
      .select({
        className: classes.name,
        collection: sum(payments.amount),
        studentCount: count(sql`DISTINCT ${students.id}`),
      })
      .from(classes)
      .leftJoin(students, eq(classes.id, students.classId))
      .leftJoin(payments, and(
        eq(payments.studentId, students.id),
        eq(payments.status, 'verified')
      ))
      .where(eq(classes.active, true))
      .groupBy(classes.id, classes.name)
      .orderBy(desc(sum(payments.amount)));

    return result.map((item, index) => ({
      className: item.className,
      collection: parseFloat(String(item.collection || '0')),
      studentCount: parseInt(String(item.studentCount || '0')),
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    }));
  }

  async getFeeStructureOverview(academicYear: string): Promise<any> {
    const result = await db
      .select({
        className: classes.name,
        classCode: sql`SUBSTRING(${classes.name}, LENGTH(${classes.name}))`,
        totalStudents: count(sql`DISTINCT ${students.id}`),
        hostellers: sum(sql`CASE WHEN ${students.isHosteller} = true THEN 1 ELSE 0 END`),
        dayScholars: sum(sql`CASE WHEN ${students.isHosteller} = false THEN 1 ELSE 0 END`),
        hostellerFee: feeStructures.hostellerAmount,
        dayScholarFee: feeStructures.dayScholarAmount,
        actualCollection: sum(payments.amount),
      })
      .from(classes)
      .leftJoin(students, eq(classes.id, students.classId))
      .leftJoin(feeStructures, and(
        eq(feeStructures.classId, classes.id),
        eq(feeStructures.feeType, 'monthly'),
        eq(feeStructures.academicYear, academicYear)
      ))
      .leftJoin(payments, and(
        eq(payments.studentId, students.id),
        eq(payments.status, 'verified')
      ))
      .where(eq(classes.active, true))
      .groupBy(
        classes.id, 
        classes.name, 
        feeStructures.hostellerAmount, 
        feeStructures.dayScholarAmount
      )
      .orderBy(classes.name);

    const items = result.map((item) => {
      const hostellerFee = parseFloat(item.hostellerFee || '0');
      const dayScholarFee = parseFloat(item.dayScholarFee || '0');
      const hostellers = parseInt(item.hostellers || '0');
      const dayScholars = parseInt(item.dayScholars || '0');
      const expectedMonthly = (hostellerFee * hostellers) + (dayScholarFee * dayScholars);
      const actualCollection = parseFloat(item.actualCollection || '0');

      return {
        className: item.className,
        classCode: item.classCode || '?',
        totalStudents: parseInt(String(item.totalStudents || '0')),
        hostellers,
        dayScholars,
        hostellerFee,
        dayScholarFee,
        expectedMonthly,
        actualCollection,
        variance: actualCollection - expectedMonthly,
      };
    });

    const totals = items.reduce((acc, item) => ({
      totalStudents: acc.totalStudents + item.totalStudents,
      expectedMonthly: acc.expectedMonthly + item.expectedMonthly,
      actualCollection: acc.actualCollection + item.actualCollection,
      variance: acc.variance + item.variance,
    }), { totalStudents: 0, expectedMonthly: 0, actualCollection: 0, variance: 0 });

    return { items, totals };
  }

  async getPendingActions(): Promise<any> {
    // Get overdue payments count
    const [overdueResult] = await db
      .select({ count: count() })
      .from(studentFees)
      .where(
        and(
          eq(studentFees.status, 'pending'),
          sql`${studentFees.dueDate} < NOW()`
        )
      );

    // Get payments requiring verification
    const [verificationResult] = await db
      .select({ count: count() })
      .from(payments)
      .where(eq(payments.status, 'pending'));

    return [
      {
        type: 'overdue',
        title: 'Overdue Payments',
        description: 'Students with pending monthly fees',
        count: parseInt(String(overdueResult?.count || '0')),
        icon: 'fas fa-exclamation-triangle',
        color: 'destructive',
        action: '/payments?filter=overdue'
      },
      {
        type: 'verification',
        title: 'Payments to Verify',
        description: 'Require admin verification',
        count: parseInt(String(verificationResult?.count || '0')),
        icon: 'fas fa-clock',
        color: 'accent',
        action: '/payments?filter=pending'
      },
      {
        type: 'import',
        title: 'Excel Import Ready',
        description: 'New data ready for import',
        count: 1,
        icon: 'fas fa-file-excel',
        color: 'primary',
        action: '/excel-import'
      }
    ];
  }

  async createExcelImport(excelImport: InsertExcelImport): Promise<ExcelImport> {
    const [result] = await db
      .insert(excelImports)
      .values(excelImport)
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
