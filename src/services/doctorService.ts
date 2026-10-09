import { doctorRepository } from "@/repositories/doctorRepository";
import { resolveUniqueEmail, defaultPasswordHash, DEFAULT_LOGIN_PASSWORD } from "@/lib/credentials";
import type { Doctor, NewDoctor } from "@/db/schema";
import type { ServiceResult, DoctorFilters, PaginatedResponse } from "@/types";

// ============================================
// DOCTOR SERVICE
// Business logic for doctor management
// ============================================

export const doctorService = {
  /**
   * Register a new doctor
   * 
   * Business Rules:
   * - Name is required
   * - Specialization is required
   * - Mobile is required and must be unique
   * - Fee must be non-negative
   * - Experience must be non-negative
   */
  async registerDoctor(data: NewDoctor): Promise<ServiceResult<Doctor> & { login?: { email: string; password: string } }> {
    // Validate required fields
    if (!data.name || data.name.trim() === "") {
      return { success: false, error: "Doctor name is required" };
    }

    if (!data.specialization || data.specialization.trim() === "") {
      return { success: false, error: "Specialization is required" };
    }

    if (!data.mobile || data.mobile.trim() === "") {
      return { success: false, error: "Mobile number is required" };
    }

    // Normalize mobile number
    const normalizedMobile = data.mobile.replace(/\s+/g, "");

    // Validate fee if provided
    if (data.fee !== undefined) {
      const feeValue = parseFloat(data.fee);
      if (isNaN(feeValue) || feeValue < 0) {
        return { success: false, error: "Fee must be a non-negative number" };
      }
    }

    // Validate experience if provided
    if (data.experience !== undefined && data.experience !== null) {
      if (data.experience < 0 || data.experience > 70) {
        return { success: false, error: "Experience must be between 0 and 70 years" };
      }
    }

    // Check for duplicate mobile
    const existingDoctor = await doctorRepository.findByMobile(normalizedMobile);
    if (existingDoctor) {
      return { 
        success: false, 
        error: `Mobile number ${normalizedMobile} is already registered to doctor: ${existingDoctor.name}` 
      };
    }

    // Resolve a unique login email + default password
    const loginEmail = await resolveUniqueEmail(data.email, normalizedMobile);
    const passwordHash = await defaultPasswordHash();

    // Create doctor + linked login user (transactional)
    const { doctor, user } = await doctorRepository.createWithUser(
      {
        ...data,
        name: data.name.trim(),
        specialization: data.specialization.trim(),
        mobile: normalizedMobile,
        email: data.email?.trim() || null,
        qualification: data.qualification?.trim() || null,
        bio: data.bio?.trim() || null,
      },
      { email: loginEmail, passwordHash, mobile: normalizedMobile }
    );

    return {
      success: true,
      data: doctor,
      login: user ? { email: user.email, password: DEFAULT_LOGIN_PASSWORD } : undefined,
    };
  },

  /**
   * Get doctor by ID
   */
  async getDoctorById(id: number): Promise<ServiceResult<Doctor>> {
    if (!id || id < 1) {
      return { success: false, error: "Invalid doctor ID" };
    }

    const doctor = await doctorRepository.findById(id);
    if (!doctor) {
      return { success: false, error: "Doctor not found" };
    }

    return { success: true, data: doctor };
  },

  /**
   * Find doctor by mobile number
   */
  async findDoctorByMobile(mobile: string): Promise<ServiceResult<Doctor>> {
    if (!mobile || mobile.trim() === "") {
      return { success: false, error: "Mobile number is required" };
    }

    const normalizedMobile = mobile.replace(/\s+/g, "");
    const doctor = await doctorRepository.findByMobile(normalizedMobile);
    
    if (!doctor) {
      return { success: false, error: "Doctor not found" };
    }

    return { success: true, data: doctor };
  },

  /**
   * Find doctors by specialization
   */
  async findDoctorsBySpecialization(specialization: string): Promise<ServiceResult<Doctor[]>> {
    if (!specialization || specialization.trim() === "") {
      return { success: false, error: "Specialization is required" };
    }

    const doctors = await doctorRepository.findBySpecialization(specialization.trim());
    return { success: true, data: doctors };
  },

  /**
   * Get all doctors with filters and pagination
   */
  async getAllDoctors(filters: DoctorFilters = {}): Promise<PaginatedResponse<Doctor>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const { doctors, total } = await doctorRepository.findAll(filters);

    return {
      success: true,
      data: doctors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update doctor
   * 
   * Business Rules:
   * - Only active doctors can be updated
   * - If mobile changes, check for duplicates
   * - Cannot leave name or specialization empty
   */
  async updateDoctor(id: number, data: Partial<NewDoctor>): Promise<ServiceResult<Doctor>> {
    if (!id || id < 1) {
      return { success: false, error: "Invalid doctor ID" };
    }

    // Check if doctor exists
    const existingDoctor = await doctorRepository.findById(id);
    if (!existingDoctor) {
      return { success: false, error: "Doctor not found" };
    }

    // Check if doctor is active
    if (!existingDoctor.isActive) {
      return { 
        success: false, 
        error: "Cannot update inactive doctor. Please reactivate the doctor first." 
      };
    }

    // Validate name if provided
    if (data.name !== undefined && data.name.trim() === "") {
      return { success: false, error: "Doctor name cannot be empty" };
    }

    // Validate specialization if provided
    if (data.specialization !== undefined && data.specialization.trim() === "") {
      return { success: false, error: "Specialization cannot be empty" };
    }

    // Check for duplicate mobile if changing
    if (data.mobile && data.mobile !== existingDoctor.mobile) {
      const normalizedMobile = data.mobile.replace(/\s+/g, "");
      const mobileExists = await doctorRepository.mobileExists(normalizedMobile, id);
      
      if (mobileExists) {
        return { 
          success: false, 
          error: `Mobile number ${normalizedMobile} is already registered to another doctor` 
        };
      }
      
      data.mobile = normalizedMobile;
    }

    // Validate fee if provided
    if (data.fee !== undefined) {
      const feeValue = parseFloat(data.fee);
      if (isNaN(feeValue) || feeValue < 0) {
        return { success: false, error: "Fee must be a non-negative number" };
      }
    }

    // Validate experience if provided
    if (data.experience !== undefined && data.experience !== null) {
      if (data.experience < 0 || data.experience > 70) {
        return { success: false, error: "Experience must be between 0 and 70 years" };
      }
    }

    // Update doctor
    const updatedDoctor = await doctorRepository.update(id, {
      ...data,
      name: data.name?.trim(),
      specialization: data.specialization?.trim(),
      email: data.email?.trim(),
      qualification: data.qualification?.trim(),
      bio: data.bio?.trim(),
    });

    if (!updatedDoctor) {
      return { success: false, error: "Failed to update doctor" };
    }

    return { success: true, data: updatedDoctor };
  },

  /**
   * Deactivate doctor (soft delete)
   */
  async deactivateDoctor(id: number): Promise<ServiceResult<Doctor>> {
    if (!id || id < 1) {
      return { success: false, error: "Invalid doctor ID" };
    }

    const existingDoctor = await doctorRepository.findById(id);
    if (!existingDoctor) {
      return { success: false, error: "Doctor not found" };
    }

    if (!existingDoctor.isActive) {
      return { success: false, error: "Doctor is already inactive" };
    }

    const doctor = await doctorRepository.deactivate(id);
    if (!doctor) {
      return { success: false, error: "Failed to deactivate doctor" };
    }

    return { success: true, data: doctor };
  },

  /**
   * Reactivate doctor
   */
  async reactivateDoctor(id: number): Promise<ServiceResult<Doctor>> {
    if (!id || id < 1) {
      return { success: false, error: "Invalid doctor ID" };
    }

    const existingDoctor = await doctorRepository.findById(id);
    if (!existingDoctor) {
      return { success: false, error: "Doctor not found" };
    }

    if (existingDoctor.isActive) {
      return { success: false, error: "Doctor is already active" };
    }

    const doctor = await doctorRepository.reactivate(id);
    if (!doctor) {
      return { success: false, error: "Failed to reactivate doctor" };
    }

    return { success: true, data: doctor };
  },

  /**
   * Search doctors
   */
  async searchDoctors(query: string, limit: number = 10): Promise<ServiceResult<Doctor[]>> {
    if (!query || query.trim() === "") {
      return { success: false, error: "Search query is required" };
    }

    const doctors = await doctorRepository.search(query.trim(), limit);
    return { success: true, data: doctors };
  },

  /**
   * Get all specializations
   */
  async getSpecializations(): Promise<ServiceResult<string[]>> {
    const specializations = await doctorRepository.getSpecializations();
    return { success: true, data: specializations };
  },

  /**
   * Get doctor statistics
   */
  async getDoctorStats(): Promise<ServiceResult<{ total: number; active: number; inactive: number }>> {
    const stats = await doctorRepository.getStats();
    return { success: true, data: stats };
  },

  /**
   * Get active doctors for selection
   */
  async getActiveDoctorsForSelection(): Promise<ServiceResult<Pick<Doctor, "id" | "name" | "specialization" | "fee">[]>> {
    const doctors = await doctorRepository.getActiveDoctors();
    return { success: true, data: doctors };
  },
};
