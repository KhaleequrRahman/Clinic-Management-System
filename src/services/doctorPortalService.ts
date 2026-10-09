import { doctorRepository } from "@/repositories/doctorRepository";
import { appointmentRepository } from "@/repositories/appointmentRepository";
import { prescriptionService } from "@/services/prescriptionService";
import type { ServiceResult } from "@/types";

// ============================================
// DOCTOR PORTAL SERVICE
// Data scoped strictly to the logged-in doctor
// ============================================

export const doctorPortalService = {
  /**
   * Get the doctor profile linked to the given user.
   */
  async getDoctorByUserId(userId: number) {
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) return { success: false as const, error: "No doctor profile linked to this account" };
    return { success: true as const, data: doctor };
  },

  /**
   * Get a doctor's appointments (optionally filtered by date/status).
   */
  async getDoctorAppointments(doctorId: number, opts: { date?: string; status?: string } = {}) {
    const list = await appointmentRepository.findForDoctor(doctorId, opts);
    return { success: true as const, data: list };
  },

  /**
   * Get a doctor's unique patients with visit counts.
   */
  async getDoctorPatients(doctorId: number) {
    const list = await appointmentRepository.getDoctorPatients(doctorId);
    return { success: true as const, data: list };
  },

  /**
   * Get a doctor's dashboard stats.
   */
  async getDoctorStats(doctorId: number) {
    const stats = await appointmentRepository.getDoctorStats(doctorId);
    return { success: true as const, data: stats };
  },

  /**
   * Verify a doctor owns an appointment. Returns the appointment or null.
   */
  async assertDoctorOwns(doctorId: number, appointmentId: number) {
    const appt = await appointmentRepository.findById(appointmentId);
    if (!appt || appt.doctorId !== doctorId) return null;
    return appt;
  },

  /**
   * Update the status of the doctor's own appointment.
   */
  async updateOwnAppointmentStatus(doctorId: number, appointmentId: number, newStatus: string): Promise<ServiceResult> {
    const owned = await this.assertDoctorOwns(doctorId, appointmentId);
    if (!owned) return { success: false, error: "Appointment not found" };

    const { appointmentService } = await import("@/services/appointmentService");
    return appointmentService.updateStatus(appointmentId, newStatus);
  },

  /**
   * Save consultation data on the doctor's own appointment.
   */
  async saveOwnConsultation(
    doctorId: number,
    appointmentId: number,
    data: { symptoms?: string; diagnosis?: string; notes?: string; vitals?: string; followUpDate?: string | null }
  ): Promise<ServiceResult> {
    const owned = await this.assertDoctorOwns(doctorId, appointmentId);
    if (!owned) return { success: false, error: "Appointment not found" };

    const { appointmentService } = await import("@/services/appointmentService");
    return appointmentService.saveConsultation(appointmentId, data);
  },

  /**
   * Create a prescription on the doctor's own appointment.
   */
  async createOwnPrescription(
    doctorId: number,
    appointmentId: number,
    data: {
      diagnosis?: string;
      notes?: string;
      followUpInstructions?: string;
      items: { medicineName: string; dosage?: string; frequency?: string; duration?: string; instructions?: string; quantity?: number }[];
    }
  ): Promise<ServiceResult> {
    const owned = await this.assertDoctorOwns(doctorId, appointmentId);
    if (!owned) return { success: false, error: "Appointment not found" };

    return prescriptionService.createPrescription({
      appointmentId,
      diagnosis: data.diagnosis,
      notes: data.notes,
      followUpInstructions: data.followUpInstructions,
      items: data.items,
    });
  },
};
