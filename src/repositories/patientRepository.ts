import { db } from "@/db";
import { patients, users, type Patient, type NewPatient } from "@/db/schema";
import { eq, ilike, and, or, sql, desc, asc } from "drizzle-orm";
import type { PatientFilters } from "@/types";

// ============================================
// PATIENT REPOSITORY
// All database queries for patients go here
// ============================================

export const patientRepository = {
  /**
   * Create a new patient
   */
  async create(data: NewPatient): Promise<Patient> {
    const [patient] = await db.insert(patients).values(data).returning();
    return patient;
  },

  /**
   * Create patient + linked user login in a single transaction
   */
  async createWithUser(
    data: NewPatient,
    userData: { email: string; passwordHash: string; mobile?: string | null }
  ): Promise<{ patient: Patient; user: { id: number; email: string } | null }> {
    return db.transaction(async (tx) => {
      const [patient] = await tx.insert(patients).values(data).returning();

      // Try to create the login user; skip if email already exists
      let user: { id: number; email: string } | null = null;
      const existing = await tx
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existing.length === 0) {
        const [createdUser] = await tx
          .insert(users)
          .values({
            email: userData.email,
            password: userData.passwordHash,
            name: data.name,
            mobile: userData.mobile || data.mobile,
            role: "patient",
          })
          .returning({ id: users.id, email: users.email });
        user = createdUser;

        // Link user to patient
        await tx
          .update(patients)
          .set({ userId: createdUser.id, updatedAt: new Date() })
          .where(eq(patients.id, patient.id));
        patient.userId = createdUser.id;
      }

      return { patient, user };
    });
  },

  /**
   * Find patient by ID
   */
  async findById(id: number): Promise<Patient | null> {
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, id))
      .limit(1);
    return patient || null;
  },

  /**
   * Find patient by mobile number
   */
  async findByMobile(mobile: string): Promise<Patient | null> {
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.mobile, mobile))
      .limit(1);
    return patient || null;
  },

  /**
   * Find patient by user ID (for patient portal login)
   */
  async findByUserId(userId: number): Promise<Patient | null> {
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, userId))
      .limit(1);
    return patient || null;
  },

  /**
   * Find patient by email
   */
  async findByEmail(email: string): Promise<Patient | null> {
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.email, email))
      .limit(1);
    return patient || null;
  },

  /**
   * Get all patients with optional filters and pagination
   */
  async findAll(filters: PatientFilters = {}): Promise<{ patients: Patient[]; total: number }> {
    const { search, isActive, gender, bloodGroup, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (typeof isActive === "boolean") {
      conditions.push(eq(patients.isActive, isActive));
    }

    if (gender) {
      conditions.push(eq(patients.gender, gender));
    }

    if (bloodGroup) {
      conditions.push(eq(patients.bloodGroup, bloodGroup as typeof patients.bloodGroup.enumValues[number]));
    }

    if (search) {
      conditions.push(
        or(
          ilike(patients.name, `%${search}%`),
          ilike(patients.mobile, `%${search}%`),
          ilike(patients.email, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get patients
    const result = await db
      .select()
      .from(patients)
      .where(whereClause)
      .orderBy(desc(patients.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(patients)
      .where(whereClause);

    return { patients: result, total: count };
  },

  /**
   * Update patient by ID
   */
  async update(id: number, data: Partial<NewPatient>): Promise<Patient | null> {
    const [patient] = await db
      .update(patients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return patient || null;
  },

  /**
   * Soft delete (deactivate) patient
   */
  async deactivate(id: number): Promise<Patient | null> {
    const [patient] = await db
      .update(patients)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return patient || null;
  },

  /**
   * Reactivate patient
   */
  async reactivate(id: number): Promise<Patient | null> {
    const [patient] = await db
      .update(patients)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return patient || null;
  },

  /**
   * Check if mobile exists (excluding a specific patient ID)
   */
  async mobileExists(mobile: string, excludeId?: number): Promise<boolean> {
    const conditions = [eq(patients.mobile, mobile)];
    
    if (excludeId) {
      conditions.push(sql`${patients.id} != ${excludeId}`);
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(patients)
      .where(and(...conditions));

    return result.count > 0;
  },

  /**
   * Search patients by name or mobile
   */
  async search(query: string, limit: number = 10): Promise<Patient[]> {
    return db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.isActive, true),
          or(
            ilike(patients.name, `%${query}%`),
            ilike(patients.mobile, `%${query}%`)
          )
        )
      )
      .orderBy(asc(patients.name))
      .limit(limit);
  },

  /**
   * Get patient statistics
   */
  async getStats(): Promise<{ total: number; active: number; inactive: number }> {
    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(patients);

    const [active] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(patients)
      .where(eq(patients.isActive, true));

    return {
      total: total.count,
      active: active.count,
      inactive: total.count - active.count,
    };
  },
};
