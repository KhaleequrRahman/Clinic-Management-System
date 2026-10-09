import { db } from "@/db";
import {
  notifications,
  patients,
  type Notification,
  type NewNotification,
} from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

// ============================================
// NOTIFICATION REPOSITORY
// ============================================

export const notificationRepository = {
  async create(data: NewNotification): Promise<Notification> {
    const [n] = await db.insert(notifications).values(data).returning();
    return n;
  },

  async createMany(data: NewNotification[]): Promise<Notification[]> {
    if (data.length === 0) return [];
    return db.insert(notifications).values(data).returning();
  },

  async findAll(filters: { page?: number; limit?: number; isRead?: boolean } = {}) {
    const { page = 1, limit = 20, isRead } = filters;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (typeof isRead === "boolean") {
      conditions.push(eq(notifications.isRead, isRead));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: notifications.id,
        patientId: notifications.patientId,
        appointmentId: notifications.appointmentId,
        type: notifications.type,
        channel: notifications.channel,
        title: notifications.title,
        message: notifications.message,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        patientName: patients.name,
      })
      .from(notifications)
      .leftJoin(patients, eq(notifications.patientId, patients.id))
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(whereClause);

    return { notifications: rows, total: count };
  },

  async getUnreadCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(eq(notifications.isRead, false));
    return result.count;
  },

  async markAsRead(id: number): Promise<Notification | null> {
    const [n] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return n || null;
  },

  async markAllAsRead(): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.isRead, false));
  },
};
