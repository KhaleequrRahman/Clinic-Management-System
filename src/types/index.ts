// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Query/Filter Types
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PatientFilters extends PaginationParams {
  search?: string;
  isActive?: boolean;
  gender?: "male" | "female" | "other";
  bloodGroup?: string;
}

export interface DoctorFilters extends PaginationParams {
  search?: string;
  isActive?: boolean;
  specialization?: string;
}

export interface AppointmentFilters extends PaginationParams {
  patientId?: number;
  doctorId?: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export interface InvoiceFilters extends PaginationParams {
  patientId?: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

// ============================================
// Service Result Types
// ============================================

export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  totalDoctors: number;
  activeDoctors: number;
  todayAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  pendingAppointments: number;
  todayRevenue: number;
  monthlyRevenue: number;
}

export interface RecentActivity {
  type: "patient" | "appointment" | "payment";
  description: string;
  timestamp: Date;
}

// ============================================
// Report Types
// ============================================

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  consultationFees: number;
  otherCharges: number;
  discounts: number;
}

export interface AppointmentReport {
  period: string;
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface DoctorReport {
  doctorId: number;
  doctorName: string;
  specialization: string;
  totalAppointments: number;
  completedAppointments: number;
  revenue: number;
}

// ============================================
// Vitals Type (stored as JSON in appointments)
// ============================================

export interface PatientVitals {
  bloodPressure?: string; // e.g., "120/80"
  temperature?: number; // in Fahrenheit
  weight?: number; // in kg
  height?: number; // in cm
  pulse?: number; // bpm
  oxygenSaturation?: number; // percentage
  respiratoryRate?: number; // breaths per minute
}

// ============================================
// Appointment with Relations
// ============================================

export interface AppointmentWithRelations {
  id: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason: string | null;
  patient: {
    id: number;
    name: string;
    mobile: string;
    age: number | null;
    gender: string | null;
  };
  doctor: {
    id: number;
    name: string;
    specialization: string;
    fee: string;
  };
}

// ============================================
// Invoice with Items
// ============================================

export interface InvoiceWithItems {
  id: number;
  invoiceNumber: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  amountPaid: string;
  status: string;
  patient: {
    id: number;
    name: string;
    mobile: string;
  };
  items: {
    id: number;
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }[];
  payments: {
    id: number;
    amount: string;
    paymentMethod: string;
    status: string;
    paidAt: Date | null;
  }[];
}

// ============================================
// Prescription with Items
// ============================================

export interface PrescriptionWithItems {
  id: number;
  diagnosis: string | null;
  notes: string | null;
  followUpInstructions: string | null;
  createdAt: Date;
  patient: {
    id: number;
    name: string;
    age: number | null;
    gender: string | null;
  };
  doctor: {
    id: number;
    name: string;
    specialization: string;
  };
  items: {
    id: number;
    medicineName: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
    quantity: number | null;
  }[];
}
