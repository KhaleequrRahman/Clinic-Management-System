import { auditLogRepository } from "@/repositories/auditLogRepository";

// ============================================
// AUDIT SERVICE
// Non-blocking audit logging
// ============================================

export const auditService = {
  /**
   * Log an action. Always non-blocking (fire-and-forget).
   */
  log(data: {
    userId?: number;
    action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "STATUS_CHANGE";
    tableName: string;
    recordId?: number;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
  }) {
    // Fire and forget — don't await, don't throw
    auditLogRepository
      .create({
        userId: data.userId || null,
        action: data.action,
        tableName: data.tableName,
        recordId: data.recordId || null,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
      })
      .catch(() => {
        // Silently ignore audit failures
      });
  },

  async getAuditLogs(filters: { page?: number; limit?: number; tableName?: string; userId?: number } = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const { logs, total } = await auditLogRepository.findAll(filters);
    return {
      success: true,
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getRecentActivity(limit: number = 10) {
    const activity = await auditLogRepository.getRecentActivity(limit);
    return { success: true, data: activity };
  },
};
