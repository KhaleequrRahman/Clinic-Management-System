import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  date,
  time,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// ENUMS
// ============================================

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const bloodGroupEnum = pgEnum("blood_group", [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"
]);

export const userRoleEnum = pgEnum("user_role", [
  "admin", "receptionist", "doctor", "patient"
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft", "pending", "paid", "partially_paid", "cancelled", "refunded"
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash", "upi", "card", "online", "bank_transfer"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending", "completed", "failed", "refunded"
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "appointment_created", "appointment_confirmed", "appointment_cancelled",
  "appointment_reminder", "prescription_ready", "payment_received", "general"
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app", "sms", "email", "whatsapp"
]);

// ============================================
// USERS TABLE (Authentication)
// ============================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  mobile: varchar("mobile", { length: 20 }),
  role: userRoleEnum("role").notNull().default("receptionist"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("users_email_idx").on(table.email),
  index("users_role_idx").on(table.role),
]);

// ============================================
// PATIENTS TABLE
// ============================================

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Link to user account for patient portal
  name: varchar("name", { length: 255 }).notNull(),
  mobile: varchar("mobile", { length: 20 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  age: integer("age"),
  gender: genderEnum("gender"),
  bloodGroup: bloodGroupEnum("blood_group").default("unknown"),
  address: text("address"),
  emergencyContact: varchar("emergency_contact", { length: 20 }),
  medicalHistory: text("medical_history"),
  allergies: text("allergies"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("patients_mobile_idx").on(table.mobile),
  index("patients_name_idx").on(table.name),
  index("patients_is_active_idx").on(table.isActive),
]);

// ============================================
// DOCTORS TABLE
// ============================================

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  specialization: varchar("specialization", { length: 255 }).notNull(),
  mobile: varchar("mobile", { length: 20 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull().default("0"),
  experience: integer("experience").default(0), // years
  qualification: varchar("qualification", { length: 255 }),
  bio: text("bio"),
  userId: integer("user_id").references(() => users.id), // Link to user account
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("doctors_mobile_idx").on(table.mobile),
  index("doctors_specialization_idx").on(table.specialization),
  index("doctors_is_active_idx").on(table.isActive),
]);

// ============================================
// APPOINTMENTS TABLE
// ============================================

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: time("appointment_time").notNull(),
  endTime: time("end_time"),
  status: appointmentStatusEnum("status").notNull().default("scheduled"),
  reason: text("reason"),
  symptoms: text("symptoms"),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  vitals: text("vitals"), // JSON string for BP, temp, weight, etc.
  followUpDate: date("follow_up_date"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("appointments_patient_idx").on(table.patientId),
  index("appointments_doctor_idx").on(table.doctorId),
  index("appointments_date_idx").on(table.appointmentDate),
  index("appointments_status_idx").on(table.status),
  index("appointments_doctor_date_idx").on(table.doctorId, table.appointmentDate),
]);

// ============================================
// PRESCRIPTIONS TABLE
// ============================================

export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull().references(() => appointments.id),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  followUpInstructions: text("follow_up_instructions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("prescriptions_appointment_idx").on(table.appointmentId),
  index("prescriptions_patient_idx").on(table.patientId),
  index("prescriptions_doctor_idx").on(table.doctorId),
]);

// ============================================
// PRESCRIPTION ITEMS TABLE
// ============================================

export const prescriptionItems = pgTable("prescription_items", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  medicineName: varchar("medicine_name", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 100 }), // e.g., "500mg"
  frequency: varchar("frequency", { length: 100 }), // e.g., "1-0-1"
  duration: varchar("duration", { length: 100 }), // e.g., "5 days"
  instructions: text("instructions"), // e.g., "After food"
  quantity: integer("quantity"),
}, (table) => [
  index("prescription_items_prescription_idx").on(table.prescriptionId),
]);

// ============================================
// INVOICES TABLE
// ============================================

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  doctorId: integer("doctor_id").references(() => doctors.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  status: invoiceStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  dueDate: date("due_date"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("invoices_patient_idx").on(table.patientId),
  index("invoices_appointment_idx").on(table.appointmentId),
  index("invoices_status_idx").on(table.status),
  index("invoices_invoice_number_idx").on(table.invoiceNumber),
]);

// ============================================
// INVOICE ITEMS TABLE
// ============================================

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
}, (table) => [
  index("invoice_items_invoice_idx").on(table.invoiceId),
]);

// ============================================
// PAYMENTS TABLE
// ============================================

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash"),
  transactionId: varchar("transaction_id", { length: 255 }),
  status: paymentStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  receivedBy: integer("received_by").references(() => users.id),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("payments_invoice_idx").on(table.invoiceId),
  index("payments_status_idx").on(table.status),
  index("payments_paid_at_idx").on(table.paidAt),
]);

// ============================================
// NOTIFICATIONS TABLE
// ============================================

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  type: notificationTypeEnum("type").notNull(),
  channel: notificationChannelEnum("channel").notNull().default("in_app"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  isSent: boolean("is_sent").notNull().default(false),
  sentAt: timestamp("sent_at"),
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("notifications_patient_idx").on(table.patientId),
  index("notifications_type_idx").on(table.type),
  index("notifications_is_read_idx").on(table.isRead),
]);

// ============================================
// AUDIT LOGS TABLE
// ============================================

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // CREATE, UPDATE, DELETE
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: integer("record_id"),
  oldValues: text("old_values"), // JSON
  newValues: text("new_values"), // JSON
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("audit_logs_user_idx").on(table.userId),
  index("audit_logs_table_idx").on(table.tableName),
  index("audit_logs_created_at_idx").on(table.createdAt),
]);

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many, one }) => ({
  auditLogs: many(auditLogs),
  doctor: one(doctors, {
    fields: [users.id],
    references: [doctors.userId],
  }),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
  prescriptions: many(prescriptions),
  invoices: many(invoices),
  notifications: many(notifications),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, {
    fields: [doctors.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
  prescriptions: many(prescriptions),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
  createdByUser: one(users, {
    fields: [appointments.createdBy],
    references: [users.id],
  }),
  prescriptions: many(prescriptions),
  invoices: many(invoices),
  notifications: many(notifications),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  appointment: one(appointments, {
    fields: [prescriptions.appointmentId],
    references: [appointments.id],
  }),
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [prescriptions.doctorId],
    references: [doctors.id],
  }),
  items: many(prescriptionItems),
}));

export const prescriptionItemsRelations = relations(prescriptionItems, ({ one }) => ({
  prescription: one(prescriptions, {
    fields: [prescriptionItems.prescriptionId],
    references: [prescriptions.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  patient: one(patients, {
    fields: [invoices.patientId],
    references: [patients.id],
  }),
  appointment: one(appointments, {
    fields: [invoices.appointmentId],
    references: [appointments.id],
  }),
  doctor: one(doctors, {
    fields: [invoices.doctorId],
    references: [doctors.id],
  }),
  createdByUser: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  receivedByUser: one(users, {
    fields: [payments.receivedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  patient: one(patients, {
    fields: [notifications.patientId],
    references: [patients.id],
  }),
  appointment: one(appointments, {
    fields: [notifications.appointmentId],
    references: [appointments.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

export type Doctor = typeof doctors.$inferSelect;
export type NewDoctor = typeof doctors.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type Prescription = typeof prescriptions.$inferSelect;
export type NewPrescription = typeof prescriptions.$inferInsert;

export type PrescriptionItem = typeof prescriptionItems.$inferSelect;
export type NewPrescriptionItem = typeof prescriptionItems.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
