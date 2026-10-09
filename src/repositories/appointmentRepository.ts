import { db } from "@/db";
import {
  appointments,
  patients,
  doctors,
  type Appointment,
  type NewAppointment,
} from "@/db/schema";
import { eq, and, sql, desc, asc, gte, lte, or, ne, ilike } from "drizzle-orm";
import type { AppointmentFilters } from "@/types";

// ============================================
// APPOINTMENT REPOSITORY
// All database queries for appointments go here
// ============================================

export const appointmentRepository = {
  /**
   * Create a new appointment
   */
  async create(data: NewAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(data)
      .returning();
    return appointment;
  },

  /**
   * Find appointment by ID
   */
  async findById(id: number): Promise<Appointment | null> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    return appointment || null;
  },

  /**
   * Find appointment by ID with patient and doctor info
   */
  async findByIdWithRelations(id: number) {
    const [row] = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        endTime: appointments.endTime,
        status: appointments.status,
        reason: appointments.reason,
        symptoms: appointments.symptoms,
        diagnosis: appointments.diagnosis,
        notes: appointments.notes,
        vitals: appointments.vitals,
        followUpDate: appointments.followUpDate,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        patientName: patients.name,
        patientMobile: patients.mobile,
        patientAge: patients.age,
        patientGender: patients.gender,
        patientBloodGroup: patients.bloodGroup,
        doctorName: doctors.name,
        doctorSpecialization: doctors.specialization,
        doctorFee: doctors.fee,
        doctorMobile: doctors.mobile,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(appointments.id, id))
      .limit(1);
    return row || null;
  },

  /**
   * Check if a doctor has a conflicting appointment at the given date/time
   */
  async checkDoctorConflict(
    doctorId: number,
    appointmentDate: string,
    appointmentTime: string,
    excludeId?: number
  ): Promise<boolean> {
    const conditions = [
      eq(appointments.doctorId, doctorId),
      eq(appointments.appointmentDate, appointmentDate),
      eq(appointments.appointmentTime, appointmentTime),
      // Only active appointments count
      or(
        eq(appointments.status, "scheduled"),
        eq(appointments.status, "confirmed"),
        eq(appointments.status, "in_progress")
      ),
    ];

    if (excludeId) {
      conditions.push(ne(appointments.id, excludeId));
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(and(...conditions));

    return result.count > 0;
  },

  /**
   * Get all appointments with filters, pagination, and relations
   */
  async findAll(filters: AppointmentFilters = {}) {
    const { patientId, doctorId, status, fromDate, toDate, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (patientId) {
      conditions.push(eq(appointments.patientId, patientId));
    }
    if (doctorId) {
      conditions.push(eq(appointments.doctorId, doctorId));
    }
    if (status) {
      conditions.push(
        eq(
          appointments.status,
          status as (typeof appointments.status.enumValues)[number]
        )
      );
    }
    if (fromDate) {
      conditions.push(gte(appointments.appointmentDate, fromDate));
    }
    if (toDate) {
      conditions.push(lte(appointments.appointmentDate, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        status: appointments.status,
        reason: appointments.reason,
        createdAt: appointments.createdAt,
        patientName: patients.name,
        patientMobile: patients.mobile,
        doctorName: doctors.name,
        doctorSpecialization: doctors.specialization,
        doctorFee: doctors.fee,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(whereClause)
      .orderBy(desc(appointments.appointmentDate), asc(appointments.appointmentTime))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(whereClause);

    return { appointments: rows, total: count };
  },

  /**
   * Get today's appointments
   */
  async findToday(doctorId?: number) {
    const today = new Date().toISOString().split("T")[0];
    const conditions = [eq(appointments.appointmentDate, today)];

    if (doctorId) {
      conditions.push(eq(appointments.doctorId, doctorId));
    }

    return db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        status: appointments.status,
        reason: appointments.reason,
        patientName: patients.name,
        patientMobile: patients.mobile,
        doctorName: doctors.name,
        doctorSpecialization: doctors.specialization,
        doctorFee: doctors.fee,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(and(...conditions))
      .orderBy(asc(appointments.appointmentTime));
  },

  /**
   * Get available time slots for a doctor on a specific date
   * Returns booked times so the frontend can subtract from all slots
   */
  async getBookedSlots(doctorId: number, date: string): Promise<string[]> {
    const rows = await db
      .select({ time: appointments.appointmentTime })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.appointmentDate, date),
          or(
            eq(appointments.status, "scheduled"),
            eq(appointments.status, "confirmed"),
            eq(appointments.status, "in_progress")
          )
        )
      )
      .orderBy(asc(appointments.appointmentTime));

    return rows.map((r) => r.time);
  },

  /**
   * Update appointment by ID
   */
  async update(
    id: number,
    data: Partial<NewAppointment>
  ): Promise<Appointment | null> {
    const [appointment] = await db
      .update(appointments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return appointment || null;
  },

  /**
   * Update appointment status
   */
  async updateStatus(
    id: number,
    status: (typeof appointments.status.enumValues)[number]
  ): Promise<Appointment | null> {
    const [appointment] = await db
      .update(appointments)
      .set({ status, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return appointment || null;
  },

  /**
   * Save consultation data (diagnosis, notes, vitals, symptoms)
   */
  async saveConsultation(
    id: number,
    data: {
      symptoms?: string;
      diagnosis?: string;
      notes?: string;
      vitals?: string;
      followUpDate?: string | null;
    }
  ): Promise<Appointment | null> {
    const [appointment] = await db
      .update(appointments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return appointment || null;
  },

  /**
   * Get appointment statistics
   */
  async getStats() {
    const today = new Date().toISOString().split("T")[0];

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments);

    const [todayResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(eq(appointments.appointmentDate, today));

    const [completedResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(eq(appointments.status, "completed"));

    const [cancelledResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(eq(appointments.status, "cancelled"));

    const [noShowResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(eq(appointments.status, "no_show"));

    const [scheduledResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(
        or(
          eq(appointments.status, "scheduled"),
          eq(appointments.status, "confirmed")
        )
      );

    return {
      total: totalResult.count,
      today: todayResult.count,
      completed: completedResult.count,
      cancelled: cancelledResult.count,
      noShow: noShowResult.count,
      scheduled: scheduledResult.count,
    };
  },

  /**
   * Get appointments for a specific patient
   */
  async findByPatientId(patientId: number) {
    return db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        status: appointments.status,
        reason: appointments.reason,
        doctorName: doctors.name,
        doctorSpecialization: doctors.specialization,
      })
      .from(appointments)
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.appointmentDate), desc(appointments.appointmentTime));
  },

  /**
   * Get appointments for a specific doctor
   */
  async findByDoctorId(doctorId: number, date?: string) {
    const conditions = [eq(appointments.doctorId, doctorId)];
    if (date) {
      conditions.push(eq(appointments.appointmentDate, date));
    }

    return db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        status: appointments.status,
        reason: appointments.reason,
        patientName: patients.name,
        patientMobile: patients.mobile,
        patientAge: patients.age,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(and(...conditions))
      .orderBy(asc(appointments.appointmentTime));
  },

  // ─────────────────────────────────────────
  // DOCTOR PORTAL (scoped to a single doctor)
  // ─────────────────────────────────────────

  /**
   * Full appointment list for a doctor, with patient + doctor details.
   */
  async findForDoctor(
    doctorId: number,
    opts: { date?: string; status?: string } = {}
  ) {
    const conditions = [eq(appointments.doctorId, doctorId)];
    if (opts.date) conditions.push(eq(appointments.appointmentDate, opts.date));
    if (opts.status) conditions.push(eq(appointments.status, opts.status as (typeof appointments.status.enumValues)[number]));

    return db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        status: appointments.status,
        reason: appointments.reason,
        symptoms: appointments.symptoms,
        diagnosis: appointments.diagnosis,
        notes: appointments.notes,
        vitals: appointments.vitals,
        followUpDate: appointments.followUpDate,
        patientId: appointments.patientId,
        patientName: patients.name,
        patientMobile: patients.mobile,
        patientAge: patients.age,
        patientGender: patients.gender,
        patientBloodGroup: patients.bloodGroup,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(and(...conditions))
      .orderBy(desc(appointments.appointmentDate), asc(appointments.appointmentTime));
  },

  /**
   * Unique patients a doctor has seen, with visit counts + last visit.
   */
  async getDoctorPatients(doctorId: number) {
    return db
      .select({
        patientId: appointments.patientId,
        patientName: patients.name,
        patientMobile: patients.mobile,
        patientAge: patients.age,
        patientGender: patients.gender,
        patientBloodGroup: patients.bloodGroup,
        visits: sql<number>`count(*)::int`,
        lastVisit: sql<string>`max(${appointments.appointmentDate})`,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(eq(appointments.doctorId, doctorId))
      .groupBy(appointments.patientId, patients.name, patients.mobile, patients.age, patients.gender, patients.bloodGroup)
      .orderBy(desc(sql`max(${appointments.appointmentDate})`));
  },

  /**
   * Quick stats for a doctor's dashboard.
   */
  async getDoctorStats(doctorId: number) {
    const today = new Date().toISOString().split("T")[0];

    const [todayResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(and(eq(appointments.doctorId, doctorId), eq(appointments.appointmentDate, today)));

    const [upcomingResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          or(eq(appointments.status, "scheduled"), eq(appointments.status, "confirmed"))
        )
      );

    const [completedResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(and(eq(appointments.doctorId, doctorId), eq(appointments.status, "completed")));

    const [patientResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${appointments.patientId})::int` })
      .from(appointments)
      .where(eq(appointments.doctorId, doctorId));

    return {
      today: todayResult.count,
      upcoming: upcomingResult.count,
      completed: completedResult.count,
      totalPatients: patientResult.count,
    };
  },
};
