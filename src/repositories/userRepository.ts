import { db } from "@/db";
import { users, type User, type NewUser } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

// ============================================
// USER REPOSITORY
// ============================================

export const userRepository = {
  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  async findById(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  },

  async findAll(): Promise<Omit<User, "password">[]> {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        mobile: users.mobile,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return rows;
  },

  async update(id: number, data: Partial<NewUser>): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  },

  async updateLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  },

  async deactivate(id: number): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  },

  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    const conditions = [eq(users.email, email)];
    if (excludeId) {
      conditions.push(sql`${users.id} != ${excludeId}`);
    }
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`${users.email} = ${email}${excludeId ? sql` AND ${users.id} != ${excludeId}` : sql``}`);
    return result.count > 0;
  },

  async getCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    return result.count;
  },
};
