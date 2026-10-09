import { db } from "@/db";
import {
  prescriptions,
  prescriptionItems,
  patients,
  doctors,
  appointments,
  type Prescription,
  type NewPrescription,
  type PrescriptionItem,
  type NewPrescriptionItem,
} from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

// ============================================
// PRESCRIPTION REPOSITORY
// ============================================

export const prescriptionRepository = {
  /**
   * Create prescription with items in a single transaction
   */
  async createWithItems(
    data: NewPrescription,
    items: Omit<NewPrescriptionItem, "prescriptionId">[]
  ): Promise<{ prescription: Prescription; items: PrescriptionItem[] }> {
    return db.transaction(async (tx) => {
      const [prescription] = await tx
        .insert(prescriptions)
        .values(data)
        .returning();

      let createdItems: PrescriptionItem[] = [];
      if (items.length > 0) {
        createdItems = await tx
          .insert(prescriptionItems)
          .values(items.map((item) => ({ ...item, prescriptionId: prescription.id })))
          .returning();
      }

      return { prescription, items: createdItems };
    });
  },

  /**
   * Find prescription by ID with items and relations
   */
  async findByIdWithRelations(id: number) {
    const [row] = await db
      .select({
        id: prescriptions.id,
        appointmentId: prescriptions.appointmentId,
        patientId: prescriptions.patientId,
        doctorId: prescriptions.doctorId,
        diagnosis: prescriptions.diagnosis,
        notes: prescriptions.notes,
        followUpInstructions: prescriptions.followUpInstructions,
        createdAt: prescriptions.createdAt,
        patientName: patients.name,
        patientAge: patients.age,
        patientGender: patients.gender,
        patientMobile: patients.mobile,
        doctorName: doctors.name,
        doctorSpecialization: doctors.specialization,
        appointmentDate: appointments.appointmentDate,
      })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .innerJoin(doctors, eq(prescriptions.doctorId, doctors.id))
      .innerJoin(appointments, eq(prescriptions.appointmentId, appointments.id))
      .where(eq(prescriptions.id, id))
      .limit(1);

    if (!row) return null;

    const items = await db
      .select()
      .from(prescriptionItems)
      .where(eq(prescriptionItems.prescriptionId, id));

    return { ...row, items };
  },

  /**
   * Find prescription by appointment ID
   */
  async findByAppointmentId(appointmentId: number) {
    const [row] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.appointmentId, appointmentId))
      .limit(1);

    if (!row) return null;

    const items = await db
      .select()
      .from(prescriptionItems)
      .where(eq(prescriptionItems.prescriptionId, row.id));

    return { ...row, items };
  },

  /**
   * Get all prescriptions (paginated, with patient/doctor names)
   */
  async findAll(filters: { patientId?: number; doctorId?: number; page?: number; limit?: number } = {}) {
    const { patientId, doctorId, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (patientId) conditions.push(eq(prescriptions.patientId, patientId));
    if (doctorId) conditions.push(eq(prescriptions.doctorId, doctorId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: prescriptions.id,
        appointmentId: prescriptions.appointmentId,
        diagnosis: prescriptions.diagnosis,
        createdAt: prescriptions.createdAt,
        patientName: patients.name,
        patientMobile: patients.mobile,
        doctorName: doctors.name,
        doctorSpecialization: doctors.specialization,
        appointmentDate: appointments.appointmentDate,
      })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .innerJoin(doctors, eq(prescriptions.doctorId, doctors.id))
      .innerJoin(appointments, eq(prescriptions.appointmentId, appointments.id))
      .where(whereClause)
      .orderBy(desc(prescriptions.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(prescriptions)
      .where(whereClause);

    return { prescriptions: rows, total: count };
  },

  /**
   * Get prescriptions for a patient
   */
  async findByPatientId(patientId: number) {
    return db
      .select({
        id: prescriptions.id,
        diagnosis: prescriptions.diagnosis,
        createdAt: prescriptions.createdAt,
        doctorName: doctors.name,
        doctorSpecialization: doctors.specialization,
        appointmentDate: appointments.appointmentDate,
      })
      .from(prescriptions)
      .innerJoin(doctors, eq(prescriptions.doctorId, doctors.id))
      .innerJoin(appointments, eq(prescriptions.appointmentId, appointments.id))
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.createdAt));
  },

  /**
   * Check if prescription already exists for an appointment
   */
  async existsForAppointment(appointmentId: number): Promise<boolean> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(prescriptions)
      .where(eq(prescriptions.appointmentId, appointmentId));
    return result.count > 0;
  },
};
