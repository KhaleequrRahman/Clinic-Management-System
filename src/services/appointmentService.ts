import { appointmentRepository } from "@/repositories/appointmentRepository";
import { patientRepository } from "@/repositories/patientRepository";
import { doctorRepository } from "@/repositories/doctorRepository";
import { notificationService } from "@/services/notificationService";
import type { Appointment, NewAppointment } from "@/db/schema";
import type { ServiceResult, AppointmentFilters } from "@/types";

// ============================================
// APPOINTMENT SERVICE
// Business logic for appointment management
// ============================================

// Standard clinic time slots (30-min intervals, 9 AM – 6 PM)
const ALL_TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

export const appointmentService = {
  /**
   * Create a new appointment
   *
   * Business Rules:
   * - Patient must exist and be active
   * - Doctor must exist and be active
   * - Date must be today or in the future
   * - Prevent doctor double-booking (same doctor, same date, same time)
   */
  async createAppointment(data: {
    patientId: number;
    doctorId: number;
    appointmentDate: string;
    appointmentTime: string;
    reason?: string;
    notes?: string;
  }): Promise<ServiceResult<Appointment>> {
    // Validate required fields
    if (!data.patientId) return { success: false, error: "Patient is required" };
    if (!data.doctorId) return { success: false, error: "Doctor is required" };
    if (!data.appointmentDate) return { success: false, error: "Appointment date is required" };
    if (!data.appointmentTime) return { success: false, error: "Appointment time is required" };

    // Validate patient exists and is active
    const patient = await patientRepository.findById(data.patientId);
    if (!patient) return { success: false, error: "Patient not found" };
    if (!patient.isActive) return { success: false, error: "Cannot book appointment for inactive patient" };

    // Validate doctor exists and is active
    const doctor = await doctorRepository.findById(data.doctorId);
    if (!doctor) return { success: false, error: "Doctor not found" };
    if (!doctor.isActive) return { success: false, error: "Cannot book appointment with inactive doctor" };

    // Validate date is not in the past
    const today = new Date().toISOString().split("T")[0];
    if (data.appointmentDate < today) {
      return { success: false, error: "Appointment date cannot be in the past" };
    }

    // Prevent doctor double-booking
    const hasConflict = await appointmentRepository.checkDoctorConflict(
      data.doctorId,
      data.appointmentDate,
      data.appointmentTime
    );

    if (hasConflict) {
      return {
        success: false,
        error: `Dr. ${doctor.name} already has an appointment at ${data.appointmentTime} on ${data.appointmentDate}. Please choose a different time.`,
      };
    }

    // Create appointment
    const appointmentData: NewAppointment = {
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      reason: data.reason?.trim() || null,
      notes: data.notes?.trim() || null,
      status: "scheduled",
    };

    const appointment = await appointmentRepository.create(appointmentData);

    // Fire notification
    try {
      await notificationService.onAppointmentCreated({
        patientId: patient.id,
        appointmentId: appointment.id,
        patientName: patient.name,
        doctorName: doctor.name,
        date: data.appointmentDate,
        time: data.appointmentTime,
      });
    } catch { /* notification failure should not block appointment creation */ }

    return { success: true, data: appointment };
  },

  /**
   * Get appointment by ID with full relations
   */
  async getAppointmentById(id: number) {
    if (!id || id < 1) return { success: false as const, error: "Invalid appointment ID" };

    const appointment = await appointmentRepository.findByIdWithRelations(id);
    if (!appointment) return { success: false as const, error: "Appointment not found" };

    return { success: true as const, data: appointment };
  },

  /**
   * Get all appointments with filters and pagination
   */
  async getAllAppointments(filters: AppointmentFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const { appointments: appts, total } =
      await appointmentRepository.findAll(filters);

    return {
      success: true,
      data: appts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  /**
   * Get today's appointments
   */
  async getTodayAppointments(doctorId?: number) {
    const appts = await appointmentRepository.findToday(doctorId);
    return { success: true as const, data: appts };
  },

  /**
   * Get available time slots for a doctor on a given date
   */
  async getAvailableSlots(
    doctorId: number,
    date: string
  ): Promise<ServiceResult<string[]>> {
    if (!doctorId) return { success: false, error: "Doctor ID is required" };
    if (!date) return { success: false, error: "Date is required" };

    const doctor = await doctorRepository.findById(doctorId);
    if (!doctor) return { success: false, error: "Doctor not found" };

    const booked = await appointmentRepository.getBookedSlots(doctorId, date);
    const bookedSet = new Set(booked);

    // If the date is today, also filter out past times
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const available = ALL_TIME_SLOTS.filter((slot) => {
      if (bookedSet.has(slot + ":00") || bookedSet.has(slot)) return false;
      if (date === today) {
        const [h, m] = slot.split(":").map(Number);
        if (h * 60 + m <= currentMinutes) return false;
      }
      return true;
    });

    return { success: true, data: available };
  },

  /**
   * Update appointment status
   *
   * Allowed transitions:
   *   scheduled  → confirmed | cancelled | no_show
   *   confirmed  → in_progress | cancelled | no_show
   *   in_progress → completed | cancelled
   */
  async updateStatus(
    id: number,
    newStatus: string
  ): Promise<ServiceResult<Appointment>> {
    if (!id || id < 1) return { success: false, error: "Invalid appointment ID" };

    const existing = await appointmentRepository.findById(id);
    if (!existing) return { success: false, error: "Appointment not found" };

    const validTransitions: Record<string, string[]> = {
      scheduled: ["confirmed", "cancelled", "no_show"],
      confirmed: ["in_progress", "cancelled", "no_show"],
      in_progress: ["completed", "cancelled"],
    };

    const allowed = validTransitions[existing.status];
    if (!allowed || !allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot change status from "${existing.status}" to "${newStatus}"`,
      };
    }

    const updated = await appointmentRepository.updateStatus(
      id,
      newStatus as (typeof existing.status)
    );
    if (!updated) return { success: false, error: "Failed to update status" };

    // Fire notifications for key status changes
    try {
      const apptDetail = await appointmentRepository.findByIdWithRelations(id);
      if (apptDetail) {
        const nData = {
          patientId: existing.patientId,
          appointmentId: id,
          patientName: apptDetail.patientName,
          doctorName: apptDetail.doctorName,
          date: existing.appointmentDate,
          time: existing.appointmentTime,
        };
        if (newStatus === "confirmed") await notificationService.onAppointmentConfirmed(nData);
        if (newStatus === "cancelled") await notificationService.onAppointmentCancelled(nData);
      }
    } catch { /* non-blocking */ }

    return { success: true, data: updated };
  },

  /**
   * Save consultation data (Phase 6 — Doctor Consultation)
   */
  async saveConsultation(
    id: number,
    data: {
      symptoms?: string;
      diagnosis?: string;
      notes?: string;
      vitals?: string; // JSON string
      followUpDate?: string | null;
    }
  ): Promise<ServiceResult<Appointment>> {
    if (!id || id < 1) return { success: false, error: "Invalid appointment ID" };

    const existing = await appointmentRepository.findById(id);
    if (!existing) return { success: false, error: "Appointment not found" };

    // Only in_progress or confirmed appointments can receive consultation data
    if (!["confirmed", "in_progress"].includes(existing.status)) {
      return {
        success: false,
        error: `Cannot add consultation data when status is "${existing.status}"`,
      };
    }

    // Auto-set to in_progress if still confirmed
    if (existing.status === "confirmed") {
      await appointmentRepository.updateStatus(id, "in_progress");
    }

    const updated = await appointmentRepository.saveConsultation(id, {
      symptoms: data.symptoms?.trim(),
      diagnosis: data.diagnosis?.trim(),
      notes: data.notes?.trim(),
      vitals: data.vitals,
      followUpDate: data.followUpDate || null,
    });

    if (!updated) return { success: false, error: "Failed to save consultation" };
    return { success: true, data: updated };
  },

  /**
   * Complete an appointment (after consultation)
   */
  async completeAppointment(id: number): Promise<ServiceResult<Appointment>> {
    return this.updateStatus(id, "completed");
  },

  /**
   * Cancel an appointment
   */
  async cancelAppointment(id: number): Promise<ServiceResult<Appointment>> {
    if (!id || id < 1) return { success: false, error: "Invalid appointment ID" };

    const existing = await appointmentRepository.findById(id);
    if (!existing) return { success: false, error: "Appointment not found" };

    if (["completed", "cancelled"].includes(existing.status)) {
      return {
        success: false,
        error: `Cannot cancel an appointment that is already "${existing.status}"`,
      };
    }

    const updated = await appointmentRepository.updateStatus(id, "cancelled");
    if (!updated) return { success: false, error: "Failed to cancel appointment" };
    return { success: true, data: updated };
  },

  /**
   * Get appointment statistics
   */
  async getAppointmentStats() {
    const stats = await appointmentRepository.getStats();
    return { success: true as const, data: stats };
  },

  /**
   * Get appointments for a specific patient
   */
  async getPatientAppointments(patientId: number) {
    if (!patientId) return { success: false as const, error: "Patient ID required" };
    const appts = await appointmentRepository.findByPatientId(patientId);
    return { success: true as const, data: appts };
  },

  /**
   * Get appointments for a specific doctor
   */
  async getDoctorAppointments(doctorId: number, date?: string) {
    if (!doctorId) return { success: false as const, error: "Doctor ID required" };
    const appts = await appointmentRepository.findByDoctorId(doctorId, date);
    return { success: true as const, data: appts };
  },

  /**
   * Reschedule an appointment (change date/time)
   */
  async rescheduleAppointment(
    id: number,
    newDate: string,
    newTime: string
  ): Promise<ServiceResult<Appointment>> {
    if (!id || id < 1) return { success: false, error: "Invalid appointment ID" };

    const existing = await appointmentRepository.findById(id);
    if (!existing) return { success: false, error: "Appointment not found" };

    if (!["scheduled", "confirmed"].includes(existing.status)) {
      return {
        success: false,
        error: `Cannot reschedule an appointment with status "${existing.status}"`,
      };
    }

    const today = new Date().toISOString().split("T")[0];
    if (newDate < today) {
      return { success: false, error: "New date cannot be in the past" };
    }

    // Check for conflict at the new slot
    const hasConflict = await appointmentRepository.checkDoctorConflict(
      existing.doctorId,
      newDate,
      newTime,
      id
    );
    if (hasConflict) {
      return {
        success: false,
        error: `Doctor already has an appointment at ${newTime} on ${newDate}`,
      };
    }

    const updated = await appointmentRepository.update(id, {
      appointmentDate: newDate,
      appointmentTime: newTime,
    });
    if (!updated) return { success: false, error: "Failed to reschedule" };
    return { success: true, data: updated };
  },
};
