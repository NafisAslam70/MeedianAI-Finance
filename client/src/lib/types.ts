// Common types for MeedianAI-Finances application

export interface User {
  id: number;
  name: string;
  email: string;
  whatsapp_number?: string;
  whatsapp_enabled: boolean;
  role: string;
  team_manager_type?: string;
  type: string;
  member_scope: string;
  image?: string;
  deep_calendar_token?: string;
  immediate_supervisor?: number;
  isTeacher?: boolean;
}

export interface Class {
  id: number;
  name: string;
  section?: string;
  track?: string;
  active: boolean;
}

export interface Student {
  id: number;
  name: string;
  admissionNumber?: string;
  admissionDate?: string;
  aadharNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  classId: number;
  sectionType?: string;
  isHosteller: boolean;
  transportChosen: boolean;
  guardianPhone?: string;
  guardianName?: string;
  guardianWhatsappNumber?: string;
  motherName?: string;
  address?: string;
  bloodGroup?: string;
  feeStatus: string;
  status: string;
  accountOpened: boolean;
  createdAt?: string;
  notes?: string;
  class?: Class;
}

export interface FeeStructure {
  id: number;
  classId: number;
  academicYear: string;
  feeType: 'monthly' | 'admission' | 'transport' | 'supply' | 'other';
  hostellerAmount: string;
  dayScholarAmount: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  class?: Class;
}

export interface StudentFee {
  id: number;
  studentId: number;
  feeStructureId: number;
  totalAmount: string;
  paidAmount: string;
  dueAmount: string;
  dueDate?: string;
  status: 'pending' | 'verified' | 'rejected' | 'partial';
  createdAt: string;
  updatedAt: string;
  student?: Student;
  feeStructure?: FeeStructure;
}

export interface Payment {
  id: number;
  studentId: number;
  studentFeeId?: number;
  amount: string;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'online';
  paymentDate: string;
  referenceNumber?: string;
  remarks?: string;
  status: 'pending' | 'verified' | 'rejected' | 'partial';
  verifiedBy?: number;
  verifiedAt?: string;
  createdBy: number;
  createdAt: string;
  studentName?: string;
  className?: string;
  student?: Student;
  studentFee?: StudentFee;
  createdByUser?: User;
  verifiedByUser?: User;
}

export interface TransportFee {
  id: number;
  studentId: number;
  routeName: string;
  monthlyAmount: string;
  academicYear: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  studentName?: string;
  className?: string;
  student?: Student;
}

export interface FinancialReport {
  id: number;
  reportType: string;
  reportPeriod: string;
  academicYear: string;
  totalExpected: string;
  totalCollected: string;
  totalOutstanding: string;
  reportData?: string;
  generatedBy: number;
  generatedAt: string;
  generatedByUser?: User;
}

export interface ExcelImport {
  id: number;
  fileName: string;
  fileSize?: number;
  sheetsProcessed: number;
  recordsImported: number;
  recordsSkipped: number;
  importStatus: string;
  errorLog?: string;
  importedBy: number;
  importedAt: string;
  importedByUser?: User;
}

// Dashboard specific types
export interface DashboardStats {
  totalStudents: number;
  totalHostellers: number;
  totalDayScholars: number;
  monthlyCollection: number;
  expectedMonthly: number;
  vanCollection: number;
  vanStudents: number;
  collectionGrowth: number;
  deficit: number;
}

export interface ClassCollection {
  className: string;
  collection: number;
  studentCount: number;
  expectedCollection?: number;
  color: string;
}

export interface FeeStructureOverviewItem {
  className: string;
  classCode: string;
  totalStudents: number;
  hostellers: number;
  dayScholars: number;
  hostellerFee: number;
  dayScholarFee: number;
  expectedMonthly: number;
  actualCollection: number;
  variance: number;
}

export interface FeeStructureOverview {
  items: FeeStructureOverviewItem[];
  totals: {
    totalStudents: number;
    expectedMonthly: number;
    actualCollection: number;
    variance: number;
  };
}

export interface PendingAction {
  type: string;
  title: string;
  description: string;
  count: number;
  icon: string;
  color: string;
  action?: string;
}

export interface CollectionTrendData {
  month: string;
  collection: number;
  expected: number;
}

// Form types
export interface CreateFeeStructureForm {
  classId: string;
  academicYear: string;
  feeType: 'monthly' | 'admission' | 'transport' | 'supply' | 'other';
  hostellerAmount: string;
  dayScholarAmount: string;
  description?: string;
}

export interface CreatePaymentForm {
  studentId: string;
  amount: string;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'online';
  paymentDate: string;
  referenceNumber?: string;
  remarks?: string;
}

export interface CreateTransportFeeForm {
  studentId: string;
  routeName: string;
  monthlyAmount: string;
  academicYear: string;
  startDate: string;
  endDate?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter and sort types
export interface StudentFilters {
  classId?: number;
  isHosteller?: boolean;
  transportChosen?: boolean;
  feeStatus?: string;
  status?: string;
  search?: string;
}

export interface PaymentFilters {
  studentId?: number;
  paymentMethod?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface FeeStructureFilters {
  classId?: number;
  academicYear?: string;
  feeType?: string;
  isActive?: boolean;
}

export interface TransportFeeFilters {
  studentId?: number;
  routeName?: string;
  academicYear?: string;
  isActive?: boolean;
  search?: string;
}

// Utility types
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface TableColumn<T = any> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
  className?: string;
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TrendDataPoint {
  month?: string;
  period?: string;
  name?: string;
  collection?: number;
  expected?: number;
  value?: number;
  revenue?: number;
  expenses?: number;
}

// Navigation types
export interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  active?: boolean;
  count?: number;
}

// Theme and UI types
export type ColorVariant = 'primary' | 'secondary' | 'accent' | 'destructive' | 'muted';
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

// Error types
export interface AppError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Component props types
export interface ComponentWithChildren {
  children: React.ReactNode;
}

export interface ComponentWithClassName {
  className?: string;
}

export interface LoadingProps {
  isLoading?: boolean;
  loadingText?: string;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
