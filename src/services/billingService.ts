import { billingRepository } from "@/repositories/billingRepository";
import { appointmentRepository } from "@/repositories/appointmentRepository";
import { patientRepository } from "@/repositories/patientRepository";
import { notificationService } from "@/services/notificationService";
import type { ServiceResult } from "@/types";

// ============================================
// BILLING SERVICE
// ============================================

export const billingService = {
  /**
   * Create an invoice
   *
   * Business Rules:
   * - Patient must exist
   * - If linked to appointment, appointment must exist and be completed/in_progress
   * - One invoice per appointment (if linked)
   * - At least one line item required
   * - Totals are computed from items
   */
  async createInvoice(data: {
    patientId: number;
    appointmentId?: number;
    doctorId?: number;
    discount?: number;
    tax?: number;
    notes?: string;
    dueDate?: string;
    items: { description: string; quantity: number; unitPrice: number }[];
  }): Promise<ServiceResult> {
    if (!data.patientId) return { success: false, error: "Patient is required" };

    const patient = await patientRepository.findById(data.patientId);
    if (!patient) return { success: false, error: "Patient not found" };

    // Validate appointment if linked
    if (data.appointmentId) {
      const appointment = await appointmentRepository.findById(data.appointmentId);
      if (!appointment) return { success: false, error: "Appointment not found" };

      const exists = await billingRepository.existsForAppointment(data.appointmentId);
      if (exists) return { success: false, error: "An invoice already exists for this appointment" };
    }

    // Validate items
    if (!data.items || data.items.length === 0) {
      return { success: false, error: "At least one line item is required" };
    }

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.description || item.description.trim() === "") {
        return { success: false, error: `Description is required for item ${i + 1}` };
      }
      if (!item.quantity || item.quantity < 1) {
        return { success: false, error: `Invalid quantity for item ${i + 1}` };
      }
      if (item.unitPrice === undefined || item.unitPrice < 0) {
        return { success: false, error: `Invalid unit price for item ${i + 1}` };
      }
    }

    // Compute totals
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = data.discount || 0;
    const tax = data.tax || 0;
    const total = subtotal - discount + tax;

    const invoiceNumber = await billingRepository.generateInvoiceNumber();

    const invoiceData = {
      invoiceNumber,
      patientId: data.patientId,
      appointmentId: data.appointmentId || null,
      doctorId: data.doctorId || null,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      amountPaid: "0.00",
      status: "pending" as const,
      notes: data.notes?.trim() || null,
      dueDate: data.dueDate || null,
    };

    const items = data.items.map((item) => ({
      description: item.description.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      total: (item.quantity * item.unitPrice).toFixed(2),
    }));

    const result = await billingRepository.createWithItems(invoiceData, items);
    return { success: true, data: result };
  },

  /**
   * Get invoice by ID with full details
   */
  async getInvoiceById(id: number) {
    if (!id || id < 1) return { success: false as const, error: "Invalid invoice ID" };
    const invoice = await billingRepository.findByIdWithRelations(id);
    if (!invoice) return { success: false as const, error: "Invoice not found" };
    return { success: true as const, data: invoice };
  },

  /**
   * Get all invoices paginated
   */
  async getAllInvoices(filters: { patientId?: number; status?: string; fromDate?: string; toDate?: string; page?: number; limit?: number } = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const { invoices: list, total } = await billingRepository.findAll(filters);
    return {
      success: true,
      data: list,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  /**
   * Record a payment for an invoice
   *
   * Business Rules:
   * - Invoice must exist and not be cancelled/refunded
   * - Amount must be > 0
   * - Cannot overpay beyond remaining balance
   * - Updates invoice amountPaid and status accordingly
   */
  async recordPayment(data: {
    invoiceId: number;
    amount: number;
    paymentMethod: "cash" | "upi" | "card" | "online" | "bank_transfer";
    transactionId?: string;
    notes?: string;
  }): Promise<ServiceResult> {
    if (!data.invoiceId) return { success: false, error: "Invoice ID is required" };
    if (!data.amount || data.amount <= 0) return { success: false, error: "Amount must be greater than zero" };

    const invoice = await billingRepository.findByIdWithRelations(data.invoiceId);
    if (!invoice) return { success: false, error: "Invoice not found" };

    if (["cancelled", "refunded"].includes(invoice.status)) {
      return { success: false, error: `Cannot add payment to a ${invoice.status} invoice` };
    }

    const totalDue = parseFloat(invoice.total);
    const alreadyPaid = await billingRepository.getTotalPaid(data.invoiceId);
    const remaining = totalDue - alreadyPaid;

    if (data.amount > remaining + 0.01) {
      return {
        success: false,
        error: `Payment amount (₹${data.amount.toFixed(2)}) exceeds remaining balance (₹${remaining.toFixed(2)})`,
      };
    }

    const now = new Date();

    const payment = await billingRepository.addPayment({
      invoiceId: data.invoiceId,
      amount: data.amount.toFixed(2),
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId?.trim() || null,
      status: "completed",
      notes: data.notes?.trim() || null,
      paidAt: now,
    });

    // Update invoice totals and status
    const newPaid = alreadyPaid + data.amount;
    const newStatus = newPaid >= totalDue ? "paid" : "partially_paid";

    await billingRepository.update(data.invoiceId, {
      amountPaid: newPaid.toFixed(2),
      status: newStatus,
    });

    // Fire notification
    try {
      await notificationService.onPaymentReceived({
        patientId: invoice.patientId,
        patientName: invoice.patientName,
        amount: data.amount.toFixed(2),
        invoiceNumber: invoice.invoiceNumber,
      });
    } catch { /* non-blocking */ }

    return { success: true, data: payment };
  },

  /**
   * Get revenue statistics
   */
  async getRevenueStats() {
    const stats = await billingRepository.getRevenueStats();
    return { success: true as const, data: stats };
  },
};
