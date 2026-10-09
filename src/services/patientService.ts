import { patientRepository } from "@/repositories/patientRepository";
import { resolveUniqueEmail, defaultPasswordHash, DEFAULT_LOGIN_PASSWORD } from "@/lib/credentials";
import type { Patient, NewPatient } from "@/db/schema";
import type { ServiceResult, PatientFilters, PaginatedResponse } from "@/types";

// ============================================
// PATIENT SERVICE
// Business logic for patient management
// ============================================

export const patientService = {
  /**
   * Register a new patient
   * 
   * Business Rules:
   * - Name is required
   * - Mobile is required and must be unique
   * - Age must be valid (0-150 if provided)
   * - Gender must be valid if provided
   */
  async registerPatient(data: NewPatient): Promise<ServiceResult<Patient> & { login?: { email: string; password: string } }> {
    // Validate required fields
    if (!data.name || data.name.trim() === "") {
      return { success: false, error: "Patient name is required" };
    }

    if (!data.mobile || data.mobile.trim() === "") {
      return { success: false, error: "Mobile number is required" };
    }

    // Normalize mobile number (remove spaces)
    const normalizedMobile = data.mobile.replace(/\s+/g, "");

    // Validate age if provided
    if (data.age !== undefined && data.age !== null) {
      if (data.age < 0 || data.age > 150) {
        return { success: false, error: "Age must be between 0 and 150" };
      }
    }

    // Check for duplicate mobile
    const existingPatient = await patientRepository.findByMobile(normalizedMobile);
    if (existingPatient) {
      return { 
        success: false, 
        error: `Mobile number ${normalizedMobile} is already registered to patient: ${existingPatient.name}` 
      };
    }

    // Resolve a unique login email + default password
    const loginEmail = await resolveUniqueEmail(data.email, normalizedMobile);
    const passwordHash = await defaultPasswordHash();

    // Create patient + linked login user (transactional)
    const { patient, user } = await patientRepository.createWithUser(
      {
        ...data,
        name: data.name.trim(),
        mobile: normalizedMobile,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
      },
      { email: loginEmail, passwordHash, mobile: normalizedMobile }
    );

    return {
      success: true,
      data: patient,
      login: user ? { email: user.email, password: DEFAULT_LOGIN_PASSWORD } : undefined,
    };
  },

  /**
   * Get patient by ID
   */
  async getPatientById(id: number): Promise<ServiceResult<Patient>> {
    if (!id || id < 1) {
      return { success: false, error: "Invalid patient ID" };
    }

    const patient = await patientRepository.findById(id);
    if (!patient) {
      return { success: false, error: "Patient not found" };
    }

    return { success: true, data: patient };
  },

  /**
   * Find patient by mobile number
   */
  async findPatientByMobile(mobile: string): Promise<ServiceResult<Patient>> {
    if (!mobile || mobile.trim() === "") {
      return { success: false, error: "Mobile number is required" };
    }

    const normalizedMobile = mobile.replace(/\s+/g, "");
    const patient = await patientRepository.findByMobile(normalizedMobile);
    
    if (!patient) {
      return { success: false, error: "Patient not found" };
    }

    return { success: true, data: patient };
  },

  /**
   * Get all patients with filters and pagination
   */
  async getAllPatients(filters: PatientFilters = {}): Promise<PaginatedResponse<Patient>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const { patients, total } = await patientRepository.findAll(filters);

    return {
      success: true,
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update patient
   * 
   * Business Rules:
   * - Only active patients can be updated
   * - If mobile changes, check for duplicates
   * - Cannot leave name empty
   */
  async updatePatient(id: number, data: Partial<NewPatient>): Promise<ServiceResult<Patient>> {
    if (!id || id < 1) {
      return { success: false, error: "Invalid patient ID" };
    }

    // Check if patient exists
    const existingPatient = await patientRepository.findById(id);
    if (!existingPatient) {
      return { success: false, error: "Patient not found" };
    }

    // Check if patient is active
    if (!existingPatient.isActive) {
      return { 
        success: false, 
        error: "Cannot update inactive patient. Please reactivate the patient first." 
      };
    }

    // Validate name if provided
    if (data.name !== undefined && data.name.trim() === "") {
      return { success: false, error: "Patient name cannot be empty" };
    }

    // Check for duplicate mobile if changing
    if (data.mobile && data.mobile !== existingPatient.mobile) {
      const normalizedMobile = data.mobile.replace(/\s+/g, "");
      const mobileExists = await patientRepository.mobileExists(normalizedMobile, id);
      
      if (mobileExists) {
        return { 
          success: false, 
          error: `Mobile number ${normalizedMobile} is already registered to another patient` 
        };
      }
      
      data.mobile = normalizedMobile;
    }

    // Validate age if provided
    if (data.age !== undefined && data.age !== null) {
      if (data.age < 0 || data.age > 150) {
        return { success: false, error: "Age must be between 0 and 150" };
      }
    }

    // Update patient
    const updatedPatient = await patientRepository.update(id, {
      ...data,
      name: data.name?.trim(),
      email: data.email?.trim(),
      address: data.address?.trim(),
    });

    if (!updatedPatient) {
      return { success: false, error: "Failed to update patient" };
    }

    return { success: true, data: updatedPatient };
  },

  /**
   * Deactivate patient (soft delete)
   * 
   * Business Rule:
   * - Preserves patient history instead of hard delete
   */
  async deactivatePatient(id: number): Promise<ServiceResult<Patient>> {
    if (!id || id < 1) {
      return { success: false, error: "Invalid patient ID" };
    }

    const existingPatient = await patientRepository.findById(id);
    if (!existingPatient) {
      return { success: false, error: "Patient not found" };
    }

    if (!existingPatient.isActive) {
      return { success: false, error: "Patient is already inactive" };
    }

    const patient = await patientRepository.deactivate(id);
    if (!patient) {
      return { success: false, error: "Failed to deactivate patient" };
    }

    return { success: true, data: patient };
  },

  /**
   * Reactivate patient
   */
  async reactivatePatient(id: number): Promise<ServiceResult<Patient>> {
    if (!id || id < 1) {
      return { success: false, error: "Invalid patient ID" };
    }

    const existingPatient = await patientRepository.findById(id);
    if (!existingPatient) {
      return { success: false, error: "Patient not found" };
    }

    if (existingPatient.isActive) {
      return { success: false, error: "Patient is already active" };
    }

    const patient = await patientRepository.reactivate(id);
    if (!patient) {
      return { success: false, error: "Failed to reactivate patient" };
    }

    return { success: true, data: patient };
  },

  /**
   * Search patients
   */
  async searchPatients(query: string, limit: number = 10): Promise<ServiceResult<Patient[]>> {
    if (!query || query.trim() === "") {
      return { success: false, error: "Search query is required" };
    }

    const patients = await patientRepository.search(query.trim(), limit);
    return { success: true, data: patients };
  },

  /**
   * Get patient statistics
   */
  async getPatientStats(): Promise<ServiceResult<{ total: number; active: number; inactive: number }>> {
    const stats = await patientRepository.getStats();
    return { success: true, data: stats };
  },
};
