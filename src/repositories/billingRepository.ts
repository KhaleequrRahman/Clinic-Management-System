import { db } from "@/db";
import {
  invoices,
  invoiceItems,
  payments,
  patients,
  doctors,
  appointments,
  type Invoice,
  type NewInvoice,
  type InvoiceItem,
  type NewInvoiceItem,
  type Payment,
  type NewPayment,
} from "@/db/schema";
import { eq, desc, sql, and, gte, lte, sum } from "drizzle-orm";

// ============================================
// BILLING REPOSITORY
// ============================================

export const billingRepository = {
  // ---------- INVOICES ----------

  /**
   * Generate next invoice number (INV-YYYYMMDD-NNN)
   */
  async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      today.getDate().toString().padStart(2, "0");

    const prefix = `INV-${dateStr}-`;

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(sql`${invoices.invoiceNumber} LIKE ${prefix + "%"}`);

    const seq = (result.count + 1).toString().padStart(3, "0");
    return prefix + seq;
  },

  /**
   * Create invoice with items
   */
  async createWithItems(
    data: NewInvoice,
    items: Omit<NewInvoiceItem, "invoiceId">[]
  ): Promise<{ invoice: Invoice; items: InvoiceItem[] }> {
    return db.transaction(async (tx) => {
      const [invoice] = await tx.insert(invoices).values(data).returning();

      let createdItems: InvoiceItem[] = [];
      if (items.length > 0) {
        createdItems = await tx
          .insert(invoiceItems)
          .values(items.map((item) => ({ ...item, invoiceId: invoice.id })))
          .returning();
      }

      return { invoice, items: createdItems };
    });
  },

  /**
   * Find invoice by ID with items, payments, patient, doctor
   */
  async findByIdWithRelations(id: number) {
    const [row] = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        patientId: invoices.patientId,
        appointmentId: invoices.appointmentId,
        doctorId: invoices.doctorId,
        subtotal: invoices.subtotal,
        discount: invoices.discount,
        tax: invoices.tax,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
        status: invoices.status,
        notes: invoices.notes,
        dueDate: invoices.dueDate,
        createdAt: invoices.createdAt,
        patientName: patients.name,
        patientMobile: patients.mobile,
        patientEmail: patients.email,
        patientAddress: patients.address,
      })
      .from(invoices)
      .innerJoin(patients, eq(invoices.patientId, patients.id))
      .where(eq(invoices.id, id))
      .limit(1);

    if (!row) return null;

    // Doctor name (optional FK)
    let doctorName: string | null = null;
    let doctorSpecialization: string | null = null;
    if (row.doctorId) {
      const [doc] = await db
        .select({ name: doctors.name, specialization: doctors.specialization })
        .from(doctors)
        .where(eq(doctors.id, row.doctorId))
        .limit(1);
      if (doc) {
        doctorName = doc.name;
        doctorSpecialization = doc.specialization;
      }
    }

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    const paymentList = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, id))
      .orderBy(desc(payments.createdAt));

    return { ...row, doctorName, doctorSpecialization, items, payments: paymentList };
  },

  /**
   * Get all invoices (paginated)
   */
  async findAll(filters: { patientId?: number; status?: string; fromDate?: string; toDate?: string; page?: number; limit?: number } = {}) {
    const { patientId, status, fromDate, toDate, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (patientId) conditions.push(eq(invoices.patientId, patientId));
    if (status) conditions.push(eq(invoices.status, status as (typeof invoices.status.enumValues)[number]));
    if (fromDate) conditions.push(gte(invoices.createdAt, new Date(fromDate)));
    if (toDate) conditions.push(lte(invoices.createdAt, new Date(toDate + "T23:59:59")));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
        status: invoices.status,
        createdAt: invoices.createdAt,
        patientName: patients.name,
        patientMobile: patients.mobile,
      })
      .from(invoices)
      .innerJoin(patients, eq(invoices.patientId, patients.id))
      .where(whereClause)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(whereClause);

    return { invoices: rows, total: count };
  },

  /**
   * Update invoice
   */
  async update(id: number, data: Partial<NewInvoice>): Promise<Invoice | null> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice || null;
  },

  /**
   * Check if invoice exists for an appointment
   */
  async existsForAppointment(appointmentId: number): Promise<boolean> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(eq(invoices.appointmentId, appointmentId));
    return result.count > 0;
  },

  // ---------- PAYMENTS ----------

  /**
   * Record a payment
   */
  async addPayment(data: NewPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(data).returning();
    return payment;
  },

  /**
   * Get total paid for an invoice
   */
  async getTotalPaid(invoiceId: number): Promise<number> {
    const [result] = await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)::float` })
      .from(payments)
      .where(and(eq(payments.invoiceId, invoiceId), eq(payments.status, "completed")));
    return result.total;
  },

  // ---------- REVENUE STATS ----------

  async getRevenueStats() {
    const today = new Date().toISOString().split("T")[0];
    const monthStart = today.slice(0, 7) + "-01";

    const [totalResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)::float` })
      .from(payments)
      .where(eq(payments.status, "completed"));

    const [todayResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)::float` })
      .from(payments)
      .where(
        and(
          eq(payments.status, "completed"),
          gte(payments.paidAt, new Date(today)),
          lte(payments.paidAt, new Date(today + "T23:59:59"))
        )
      );

    const [monthResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)::float` })
      .from(payments)
      .where(
        and(
          eq(payments.status, "completed"),
          gte(payments.paidAt, new Date(monthStart))
        )
      );

    const [invoiceCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices);

    const [paidCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(eq(invoices.status, "paid"));

    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(eq(invoices.status, "pending"));

    return {
      totalRevenue: totalResult.total,
      todayRevenue: todayResult.total,
      monthlyRevenue: monthResult.total,
      totalInvoices: invoiceCount.count,
      paidInvoices: paidCount.count,
      pendingInvoices: pendingCount.count,
    };
  },
};
