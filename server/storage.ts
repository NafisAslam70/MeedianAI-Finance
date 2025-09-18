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
  type InsertStudent,
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
  createStudent(student: InsertStudent): Promise<Student>;
  
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
      .returning() as User[];
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

  async createStudent(studentData: any): Promise<Student> {
    const [result] = await db
      .insert(students)
      .values(studentData)
      .returning();
    return result;
  }

  async getClasses(): Promise<Class[]> {
    return await db
      .select()
      .from(classes)
      .where(eq(classes.active, true))
      .orderBy(classes.name);
  }

  async getFeeStructures(academicYear?: string): Promise<FeeStructure[]> {
    if (academicYear) {
      return await db
        .select()
        .from(feeStructures)
        .where(and(eq(feeStructures.isActive, true), eq(feeStructures.academicYear, academicYear)))
        .orderBy(feeStructures.classId, feeStructures.feeType);
    } else {
      return await db
        .select()
        .from(feeStructures)
        .where(eq(feeStructures.isActive, true))
        .orderBy(feeStructures.classId, feeStructures.feeType);
    }
  }

  async createFeeStructure(feeStructure: InsertFeeStructure): Promise<FeeStructure> {
    const [result] = await db
      .insert(feeStructures)
      .values(feeStructure)
      .returning();
    return result;
  }

  async getStudentFees(studentId?: number, classId?: number): Promise<StudentFee[]> {
    if (studentId) {
      return await db
        .select()
        .from(studentFees)
        .where(eq(studentFees.studentId, studentId))
        .orderBy(desc(studentFees.createdAt));
    } else {
      return await db
        .select()
        .from(studentFees)
        .orderBy(desc(studentFees.createdAt));
    }
  }

  async createStudentFee(studentFee: InsertStudentFee): Promise<StudentFee> {
    const [result] = await db
      .insert(studentFees)
      .values(studentFee)
      .returning();
    return result;
  }

  async getPayments(studentId?: number, limit?: number): Promise<Payment[]> {
    const baseQuery = db
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
    
    if (studentId && limit) {
      return await baseQuery
        .where(eq(payments.studentId, studentId))
        .orderBy(desc(payments.paymentDate))
        .limit(limit);
    } else if (studentId) {
      return await baseQuery
        .where(eq(payments.studentId, studentId))
        .orderBy(desc(payments.paymentDate));
    } else if (limit) {
      return await baseQuery
        .orderBy(desc(payments.paymentDate))
        .limit(limit);
    } else {
      return await baseQuery
        .orderBy(desc(payments.paymentDate));
    }
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
    const baseQuery = db
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
      return await baseQuery
        .where(and(eq(transportFees.isActive, true), eq(transportFees.academicYear, academicYear)))
        .orderBy(transportFees.routeName, students.name);
    } else {
      return await baseQuery
        .where(eq(transportFees.isActive, true))
        .orderBy(transportFees.routeName, students.name);
    }
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

// In-memory storage implementation with sample data
export class MemStorage implements IStorage {
  private users: User[] = [
    { id: 1, name: "Admin User", email: "admin@school.com", password: "hashed", role: "admin", whatsapp_number: "+1234567890", whatsapp_enabled: true, type: "residential", member_scope: "i_member", image: null, deep_calendar_token: null, immediate_supervisor: null, isTeacher: false, team_manager_type: null }
  ];

  private classes: Class[] = [
    { id: 1, name: "Class 1", section: "A", track: "elementary", active: true },
    { id: 2, name: "Class 2", section: "A", track: "elementary", active: true },
    { id: 3, name: "Class 3", section: "B", track: "elementary", active: true },
    { id: 4, name: "Class 4", section: "A", track: "elementary", active: true },
    { id: 5, name: "Class 5", section: "A", track: "elementary", active: true }
  ];

  private students: Student[] = [
    {
      id: 1,
      name: "John Doe",
      admissionNumber: "ADM001",
      admissionDate: new Date('2024-01-15'),
      aadharNumber: "123456789012",
      dateOfBirth: new Date('2010-05-20'),
      gender: "Male",
      classId: 1,
      sectionType: "A",
      isHosteller: false,
      transportChosen: true,
      guardianPhone: "+1234567890",
      guardianName: "Mr. Doe",
      guardianWhatsappNumber: "+1234567890",
      motherName: "Mrs. Doe",
      address: "123 Main Street, City",
      bloodGroup: "O+",
      feeStatus: "Paid",
      status: "active",
      accountOpened: true,
      createdAt: new Date(),
      notes: []
    },
    {
      id: 2,
      name: "Jane Smith",
      admissionNumber: "ADM002",
      admissionDate: new Date('2024-01-20'),
      aadharNumber: "987654321098",
      dateOfBirth: new Date('2011-03-15'),
      gender: "Female",
      classId: 2,
      sectionType: "A",
      isHosteller: true,
      transportChosen: false,
      guardianPhone: "+0987654321",
      guardianName: "Mr. Smith",
      guardianWhatsappNumber: "+0987654321",
      motherName: "Mrs. Smith",
      address: "456 Oak Avenue, Town",
      bloodGroup: "A+",
      feeStatus: "Pending",
      status: "active",
      accountOpened: false,
      createdAt: new Date(),
      notes: []
    }
  ];

  private payments: Payment[] = [
    {
      id: 1,
      studentId: 1,
      studentFeeId: 1,
      amount: "5000.00",
      paymentMethod: "upi",
      transactionId: "TXN001",
      paymentDate: new Date(),
      status: "verified",
      verifiedBy: 1,
      verifiedAt: new Date(),
      remarks: "Monthly fee payment",
      receiptUrl: null,
      createdAt: new Date()
    }
  ];

  private nextId = {
    users: 2,
    classes: 6,
    students: 3,
    payments: 2
  };

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.email === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextId.users++,
      ...user,
      role: user.role || "member",
      whatsapp_enabled: user.whatsapp_enabled ?? true,
      type: user.type || "residential",
      member_scope: user.member_scope || "i_member"
    };
    this.users.push(newUser);
    return newUser;
  }

  async getStudents(): Promise<Student[]> {
    return [...this.students];
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.find(s => s.id === id);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const newStudent: Student = {
      id: this.nextId.students++,
      createdAt: new Date(),
      notes: [],
      feeStatus: "Pending",
      status: "active",
      accountOpened: false,
      isHosteller: false,
      transportChosen: false,
      ...student,
    };
    this.students.push(newStudent);
    return newStudent;
  }

  async getClasses(): Promise<Class[]> {
    return [...this.classes];
  }

  async getFeeStructures(): Promise<FeeStructure[]> {
    return [];
  }

  async createFeeStructure(): Promise<FeeStructure> {
    throw new Error("Not implemented in MemStorage");
  }

  async getStudentFees(): Promise<StudentFee[]> {
    return [];
  }

  async createStudentFee(): Promise<StudentFee> {
    throw new Error("Not implemented in MemStorage");
  }

  async getPayments(): Promise<any[]> {
    return this.payments.map(payment => {
      const student = this.students.find(s => s.id === payment.studentId);
      const className = this.classes.find(c => c.id === student?.classId)?.name;
      return {
        ...payment,
        studentName: student?.name || 'Unknown Student',
        className: className || 'Unknown Class',
        referenceNumber: payment.transactionId
      };
    });
  }

  async createPayment(): Promise<Payment> {
    throw new Error("Not implemented in MemStorage");
  }

  async verifyPayment(): Promise<Payment | undefined> {
    throw new Error("Not implemented in MemStorage");
  }

  async getTransportFees(): Promise<TransportFee[]> {
    return [];
  }

  async createTransportFee(): Promise<TransportFee> {
    throw new Error("Not implemented in MemStorage");
  }

  async getDashboardStats(): Promise<any> {
    return {
      totalStudents: this.students.length,
      activeStudents: this.students.filter(s => s.status === 'active').length,
      totalClasses: this.classes.length,
      monthlyCollection: 15000,
      pendingPayments: 1,
      totalCollection: 125000
    };
  }

  async getCollectionTrend(): Promise<any> {
    return [
      { month: "Jan", amount: 12000 },
      { month: "Feb", amount: 15000 },
      { month: "Mar", amount: 18000 },
      { month: "Apr", amount: 16000 },
      { month: "May", amount: 20000 },
      { month: "Jun", amount: 22000 }
    ];
  }

  async getClassCollections(): Promise<any> {
    return this.classes.map((cls, index) => ({
      className: cls.name,
      collection: (index + 1) * 5000,
      studentCount: Math.floor(Math.random() * 30) + 10,
      color: `hsl(var(--chart-${(index % 5) + 1}))`
    }));
  }

  async getFeeStructureOverview(): Promise<any> {
    const items = this.classes.map(cls => ({
      className: cls.name,
      classCode: cls.name.slice(-1),
      totalStudents: Math.floor(Math.random() * 30) + 10,
      hostellers: Math.floor(Math.random() * 10) + 5,
      dayScholars: Math.floor(Math.random() * 20) + 10,
      hostellerFee: 8000,
      dayScholarFee: 5000,
      expectedMonthly: Math.floor(Math.random() * 50000) + 30000,
      actualCollection: Math.floor(Math.random() * 45000) + 25000,
      variance: Math.floor(Math.random() * 10000) - 5000
    }));
    
    const totals = items.reduce((acc, item) => ({
      totalStudents: acc.totalStudents + item.totalStudents,
      expectedMonthly: acc.expectedMonthly + item.expectedMonthly,
      actualCollection: acc.actualCollection + item.actualCollection,
      variance: acc.variance + item.variance
    }), { totalStudents: 0, expectedMonthly: 0, actualCollection: 0, variance: 0 });
    
    return { items, totals };
  }

  async getPendingActions(): Promise<any> {
    return [
      {
        type: 'overdue',
        title: 'Overdue Payments',
        description: 'Students with pending monthly fees',
        count: 3,
        icon: 'fas fa-exclamation-triangle',
        color: 'destructive',
        action: '/payments?filter=overdue'
      },
      {
        type: 'verification',
        title: 'Payments to Verify',
        description: 'Require admin verification',
        count: 2,
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

  async createExcelImport(): Promise<ExcelImport> {
    throw new Error("Not implemented in MemStorage");
  }
}

// Use MemStorage by default, DatabaseStorage when database is available
export const storage: IStorage = process.env.USE_DATABASE === 'true' ? new DatabaseStorage() : new MemStorage();
