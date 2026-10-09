import { db } from "@/db";
import { auditLogs, users, type AuditLog, type NewAuditLog } from "@/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

// ============================================
// AUDIT LOG REPOSITORY
// ============================================

export const auditLogRepository = {
  async create(data: NewAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  },

  async findAll(filters: { page?: number; limit?: number; tableName?: string; userId?: number } = {}) {
    const { page = 1, limit = 20, tableName, userId } = filters;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (tableName) conditions.push(eq(auditLogs.tableName, tableName));
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        tableName: auditLogs.tableName,
        recordId: auditLogs.recordId,
        oldValues: auditLogs.oldValues,
        newValues: auditLogs.newValues,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(whereClause);

    return { logs: rows, total: count };
  },

  async getRecentActivity(limit: number = 10) {
    return db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        tableName: auditLogs.tableName,
        recordId: auditLogs.recordId,
        createdAt: auditLogs.createdAt,
        userName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  },
};
