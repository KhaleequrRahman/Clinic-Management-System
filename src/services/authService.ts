import { userRepository } from "@/repositories/userRepository";
import { hashPassword, verifyPassword, setSessionCookie, clearSession } from "@/lib/auth";
import type { User, NewUser } from "@/db/schema";
import type { ServiceResult } from "@/types";

// ============================================
// AUTH SERVICE
// ============================================

export const authService = {
  /**
   * Login user
   */
  async login(email: string, password: string): Promise<ServiceResult<Omit<User, "password">>> {
    if (!email || !email.trim()) return { success: false, error: "Email is required" };
    if (!password) return { success: false, error: "Password is required" };

    const user = await userRepository.findByEmail(email.trim().toLowerCase());
    if (!user) return { success: false, error: "Invalid email or password" };

    if (!user.isActive) return { success: false, error: "Account is deactivated. Contact administrator." };

    const valid = await verifyPassword(password, user.password);
    if (!valid) return { success: false, error: "Invalid email or password" };

    // Set session cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Update last login
    await userRepository.updateLastLogin(user.id);

    const { password: _, ...safeUser } = user;
    return { success: true, data: safeUser };
  },

  /**
   * Logout user
   */
  async logout(): Promise<ServiceResult> {
    await clearSession();
    return { success: true };
  },

  /**
   * Create a new user (admin only)
   */
  async createUser(data: {
    email: string;
    password: string;
    name: string;
    mobile?: string;
    role: "admin" | "receptionist" | "doctor" | "patient";
  }): Promise<ServiceResult<Omit<User, "password">>> {
    if (!data.email || !data.email.trim()) return { success: false, error: "Email is required" };
    if (!data.password || data.password.length < 6) return { success: false, error: "Password must be at least 6 characters" };
    if (!data.name || !data.name.trim()) return { success: false, error: "Name is required" };

    const normalizedEmail = data.email.trim().toLowerCase();

    // Check duplicate email
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) return { success: false, error: "Email is already registered" };

    const hashed = await hashPassword(data.password);

    const user = await userRepository.create({
      email: normalizedEmail,
      password: hashed,
      name: data.name.trim(),
      mobile: data.mobile?.trim() || null,
      role: data.role,
    });

    const { password: _, ...safeUser } = user;
    return { success: true, data: safeUser };
  },

  /**
   * Get all users (admin)
   */
  async getAllUsers() {
    const users = await userRepository.findAll();
    return { success: true as const, data: users };
  },

  /**
   * Change password
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<ServiceResult> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters" };
    }

    const user = await userRepository.findById(userId);
    if (!user) return { success: false, error: "User not found" };

    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) return { success: false, error: "Current password is incorrect" };

    const hashed = await hashPassword(newPassword);
    await userRepository.update(userId, { password: hashed });

    return { success: true };
  },

  /**
   * Seed initial admin if no users exist
   */
  async seedAdminIfNeeded(): Promise<boolean> {
    const count = await userRepository.getCount();
    if (count > 0) return false;

    const hashed = await hashPassword("admin123");
    await userRepository.create({
      email: "admin@clinic.com",
      password: hashed,
      name: "Admin",
      role: "admin",
    });

    return true;
  },
};
