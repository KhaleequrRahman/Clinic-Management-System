import { prescriptionRepository } from "@/repositories/prescriptionRepository";
import { appointmentRepository } from "@/repositories/appointmentRepository";
import { patientRepository } from "@/repositories/patientRepository";
import { doctorRepository } from "@/repositories/doctorRepository";
import { notificationService } from "@/services/notificationService";
import type { NewPrescription, NewPrescriptionItem } from "@/db/schema";
import type { ServiceResult } from "@/types";

// ============================================
// PRESCRIPTION SERVICE
// ============================================

export const prescriptionService = {
  /**
   * Create a prescription for an appointment
   *
   * Business Rules:
   * - Appointment must exist
   * - Appointment must be in_progress or completed
   * - Only one prescription per appointment
   * - At least one medicine item required
   */
  async createPrescription(data: {
    appointmentId: number;
    diagnosis?: string;
    notes?: string;
    followUpInstructions?: string;
    items: {
      medicineName: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
      quantity?: number;
    }[];
  }): Promise<ServiceResult> {
    if (!data.appointmentId) return { success: false, error: "Appointment ID is required" };

    const appointment = await appointmentRepository.findById(data.appointmentId);
    if (!appointment) return { success: false, error: "Appointment not found" };

    if (!["in_progress", "completed"].includes(appointment.status)) {
      return {
        success: false,
        error: `Cannot create prescription when appointment status is "${appointment.status}". Appointment must be in progress or completed.`,
      };
    }

    // Check duplicate
    const exists = await prescriptionRepository.existsForAppointment(data.appointmentId);
    if (exists) {
      return { success: false, error: "A prescription already exists for this appointment" };
    }

    // Validate items
    if (!data.items || data.items.length === 0) {
      return { success: false, error: "At least one medicine is required" };
    }

    for (let i = 0; i < data.items.length; i++) {
      if (!data.items[i].medicineName || data.items[i].medicineName.trim() === "") {
        return { success: false, error: `Medicine name is required for item ${i + 1}` };
      }
    }

    const prescriptionData: NewPrescription = {
      appointmentId: data.appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      diagnosis: data.diagnosis?.trim() || null,
      notes: data.notes?.trim() || null,
      followUpInstructions: data.followUpInstructions?.trim() || null,
    };

    const items: Omit<NewPrescriptionItem, "prescriptionId">[] = data.items.map((item) => ({
      medicineName: item.medicineName.trim(),
      dosage: item.dosage?.trim() || null,
      frequency: item.frequency?.trim() || null,
      duration: item.duration?.trim() || null,
      instructions: item.instructions?.trim() || null,
      quantity: item.quantity || null,
    }));

    const result = await prescriptionRepository.createWithItems(prescriptionData, items);

    // Fire notification
    try {
      const patient = await patientRepository.findById(appointment.patientId);
      const doctor = await doctorRepository.findById(appointment.doctorId);
      if (patient && doctor) {
        await notificationService.onPrescriptionReady({
          patientId: patient.id,
          appointmentId: appointment.id,
          patientName: patient.name,
          doctorName: doctor.name,
        });
      }
    } catch { /* non-blocking */ }

    return { success: true, data: result };
  },

  /**
   * Get prescription by ID with full details
   */
  async getPrescriptionById(id: number) {
    if (!id || id < 1) return { success: false as const, error: "Invalid prescription ID" };

    const prescription = await prescriptionRepository.findByIdWithRelations(id);
    if (!prescription) return { success: false as const, error: "Prescription not found" };

    return { success: true as const, data: prescription };
  },

  /**
   * Get prescription for an appointment
   */
  async getPrescriptionByAppointment(appointmentId: number) {
    if (!appointmentId) return { success: false as const, error: "Appointment ID is required" };

    const prescription = await prescriptionRepository.findByAppointmentId(appointmentId);
    if (!prescription) return { success: false as const, error: "No prescription found for this appointment" };

    return { success: true as const, data: prescription };
  },

  /**
   * Get all prescriptions with pagination
   */
  async getAllPrescriptions(filters: { patientId?: number; doctorId?: number; page?: number; limit?: number } = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const { prescriptions: list, total } = await prescriptionRepository.findAll(filters);

    return {
      success: true,
      data: list,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  /**
   * Get prescriptions for a patient
   */
  async getPatientPrescriptions(patientId: number) {
    if (!patientId) return { success: false as const, error: "Patient ID is required" };
    const list = await prescriptionRepository.findByPatientId(patientId);
    return { success: true as const, data: list };
  },
};
