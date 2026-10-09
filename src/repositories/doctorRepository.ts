import { db } from "@/db";
import { doctors, users, type Doctor, type NewDoctor } from "@/db/schema";
import { eq, ilike, and, or, sql, desc, asc } from "drizzle-orm";
import type { DoctorFilters } from "@/types";

// ============================================
// DOCTOR REPOSITORY
// All database queries for doctors go here
// ============================================

export const doctorRepository = {
  /**
   * Create a new doctor
   */
  async create(data: NewDoctor): Promise<Doctor> {
    const [doctor] = await db.insert(doctors).values(data).returning();
    return doctor;
  },

  /**
   * Find doctor by user ID (for doctor portal)
   */
  async findByUserId(userId: number): Promise<Doctor | null> {
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.userId, userId))
      .limit(1);
    return doctor || null;
  },

  /**
   * Find doctor by ID
   */
  async findById(id: number): Promise<Doctor | null> {
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.id, id))
      .limit(1);
    return doctor || null;
  },

  /**
   * Create doctor + linked user login in a single transaction
   */
  async createWithUser(
    data: NewDoctor,
    userData: { email: string; passwordHash: string; mobile?: string | null }
  ): Promise<{ doctor: Doctor; user: { id: number; email: string } | null }> {
    return db.transaction(async (tx) => {
      const [doctor] = await tx.insert(doctors).values(data).returning();

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
            role: "doctor",
          })
          .returning({ id: users.id, email: users.email });
        user = createdUser;

        await tx
          .update(doctors)
          .set({ userId: createdUser.id, updatedAt: new Date() })
          .where(eq(doctors.id, doctor.id));
        doctor.userId = createdUser.id;
      }

      return { doctor, user };
    });
  },

  /**
   * Find doctor by mobile number
   */
  async findByMobile(mobile: string): Promise<Doctor | null> {
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.mobile, mobile))
      .limit(1);
    return doctor || null;
  },

  /**
   * Find doctors by specialization
   */
  async findBySpecialization(specialization: string): Promise<Doctor[]> {
    return db
      .select()
      .from(doctors)
      .where(
        and(
          ilike(doctors.specialization, `%${specialization}%`),
          eq(doctors.isActive, true)
        )
      )
      .orderBy(asc(doctors.name));
  },

  /**
   * Get all doctors with optional filters and pagination
   */
  async findAll(filters: DoctorFilters = {}): Promise<{ doctors: Doctor[]; total: number }> {
    const { search, isActive, specialization, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (typeof isActive === "boolean") {
      conditions.push(eq(doctors.isActive, isActive));
    }

    if (specialization) {
      conditions.push(ilike(doctors.specialization, `%${specialization}%`));
    }

    if (search) {
      conditions.push(
        or(
          ilike(doctors.name, `%${search}%`),
          ilike(doctors.mobile, `%${search}%`),
          ilike(doctors.specialization, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get doctors
    const result = await db
      .select()
      .from(doctors)
      .where(whereClause)
      .orderBy(desc(doctors.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(doctors)
      .where(whereClause);

    return { doctors: result, total: count };
  },

  /**
   * Update doctor by ID
   */
  async update(id: number, data: Partial<NewDoctor>): Promise<Doctor | null> {
    const [doctor] = await db
      .update(doctors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(doctors.id, id))
      .returning();
    return doctor || null;
  },

  /**
   * Soft delete (deactivate) doctor
   */
  async deactivate(id: number): Promise<Doctor | null> {
    const [doctor] = await db
      .update(doctors)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(doctors.id, id))
      .returning();
    return doctor || null;
  },

  /**
   * Reactivate doctor
   */
  async reactivate(id: number): Promise<Doctor | null> {
    const [doctor] = await db
      .update(doctors)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(doctors.id, id))
      .returning();
    return doctor || null;
  },

  /**
   * Check if mobile exists (excluding a specific doctor ID)
   */
  async mobileExists(mobile: string, excludeId?: number): Promise<boolean> {
    const conditions = [eq(doctors.mobile, mobile)];
    
    if (excludeId) {
      conditions.push(sql`${doctors.id} != ${excludeId}`);
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(doctors)
      .where(and(...conditions));

    return result.count > 0;
  },

  /**
   * Search doctors by name or specialization
   */
  async search(query: string, limit: number = 10): Promise<Doctor[]> {
    return db
      .select()
      .from(doctors)
      .where(
        and(
          eq(doctors.isActive, true),
          or(
            ilike(doctors.name, `%${query}%`),
            ilike(doctors.specialization, `%${query}%`)
          )
        )
      )
      .orderBy(asc(doctors.name))
      .limit(limit);
  },

  /**
   * Get all unique specializations
   */
  async getSpecializations(): Promise<string[]> {
    const result = await db
      .selectDistinct({ specialization: doctors.specialization })
      .from(doctors)
      .where(eq(doctors.isActive, true))
      .orderBy(asc(doctors.specialization));

    return result.map((r) => r.specialization);
  },

  /**
   * Get doctor statistics
   */
  async getStats(): Promise<{ total: number; active: number; inactive: number }> {
    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(doctors);

    const [active] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(doctors)
      .where(eq(doctors.isActive, true));

    return {
      total: total.count,
      active: active.count,
      inactive: total.count - active.count,
    };
  },

  /**
   * Get active doctors for dropdown/selection
   */
  async getActiveDoctors(): Promise<Pick<Doctor, "id" | "name" | "specialization" | "fee">[]> {
    return db
      .select({
        id: doctors.id,
        name: doctors.name,
        specialization: doctors.specialization,
        fee: doctors.fee,
      })
      .from(doctors)
      .where(eq(doctors.isActive, true))
      .orderBy(asc(doctors.name));
  },
};
