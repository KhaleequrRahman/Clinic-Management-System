import { notificationRepository } from "@/repositories/notificationRepository";
import type { NewNotification } from "@/db/schema";
import type { ServiceResult } from "@/types";

// ============================================
// NOTIFICATION SERVICE
// ============================================

export const notificationService = {
  // ---- Trigger helpers (called by other services) ----

  async onAppointmentCreated(data: {
    patientId: number;
    appointmentId: number;
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
  }) {
    await notificationRepository.create({
      patientId: data.patientId,
      appointmentId: data.appointmentId,
      type: "appointment_created",
      channel: "in_app",
      title: "Appointment Booked",
      message: `Appointment for ${data.patientName} with Dr. ${data.doctorName} on ${data.date} at ${data.time} has been booked.`,
    });
  },

  async onAppointmentConfirmed(data: {
    patientId: number;
    appointmentId: number;
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
  }) {
    await notificationRepository.create({
      patientId: data.patientId,
      appointmentId: data.appointmentId,
      type: "appointment_confirmed",
      channel: "in_app",
      title: "Appointment Confirmed",
      message: `Appointment for ${data.patientName} with Dr. ${data.doctorName} on ${data.date} at ${data.time} has been confirmed.`,
    });
  },

  async onAppointmentCancelled(data: {
    patientId: number;
    appointmentId: number;
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
  }) {
    await notificationRepository.create({
      patientId: data.patientId,
      appointmentId: data.appointmentId,
      type: "appointment_cancelled",
      channel: "in_app",
      title: "Appointment Cancelled",
      message: `Appointment for ${data.patientName} with Dr. ${data.doctorName} on ${data.date} at ${data.time} has been cancelled.`,
    });
  },

  async onPrescriptionReady(data: {
    patientId: number;
    appointmentId: number;
    patientName: string;
    doctorName: string;
  }) {
    await notificationRepository.create({
      patientId: data.patientId,
      appointmentId: data.appointmentId,
      type: "prescription_ready",
      channel: "in_app",
      title: "Prescription Ready",
      message: `Prescription for ${data.patientName} by Dr. ${data.doctorName} is ready.`,
    });
  },

  async onPaymentReceived(data: {
    patientId: number;
    patientName: string;
    amount: string;
    invoiceNumber: string;
  }) {
    await notificationRepository.create({
      patientId: data.patientId,
      type: "payment_received",
      channel: "in_app",
      title: "Payment Received",
      message: `Payment of ₹${data.amount} received from ${data.patientName}. Invoice: ${data.invoiceNumber}`,
    });
  },

  // ---- CRUD ----

  async getAllNotifications(filters: { page?: number; limit?: number; isRead?: boolean } = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const { notifications: list, total } = await notificationRepository.findAll(filters);
    return {
      success: true,
      data: list,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getUnreadCount(): Promise<ServiceResult<number>> {
    const count = await notificationRepository.getUnreadCount();
    return { success: true, data: count };
  },

  async markAsRead(id: number): Promise<ServiceResult> {
    const n = await notificationRepository.markAsRead(id);
    if (!n) return { success: false, error: "Notification not found" };
    return { success: true, data: n };
  },

  async markAllAsRead(): Promise<ServiceResult> {
    await notificationRepository.markAllAsRead();
    return { success: true };
  },
};
