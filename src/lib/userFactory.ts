import { userRepository } from "@/repositories/userRepository";
import { hashPassword } from "@/lib/auth";

// ============================================
// USER FACTORY
// Auto-creates a user account for a doctor or patient
// so admin-created records automatically get login credentials.
// ============================================

export interface GeneratedCredentials {
  email: string;
  password: string;
}

export async function createLoginForEntity(opts: {
  name: string;
  email?: string | null;
  mobile: string;
  role: "doctor" | "patient";
}): Promise<{ userId: number; credentials: GeneratedCredentials }> {
  const roleLabel = opts.role === "doctor" ? "dr" : "pt";
  const digits = opts.mobile.replace(/\D/g, "");

  // Preferred email: provided email, otherwise generated from role + mobile
  const baseEmail =
    opts.email?.trim().toLowerCase() ||
    `${roleLabel}${digits}@clinic.com`;

  // Ensure the email is unique
  let email = baseEmail;
  let counter = 1;
  while (await userRepository.findByEmail(email)) {
    email = baseEmail.replace("@", `${counter}@`);
    counter++;
  }

  // Generated password: Cms@ + last 4 digits of mobile
  const last4 = digits.slice(-4) || "0000";
  const password = `Cms@${last4}`;

  const user = await userRepository.create({
    email,
    password: await hashPassword(password),
    name: opts.name.trim(),
    mobile: opts.mobile.trim(),
    role: opts.role,
  });

  return { userId: user.id, credentials: { email, password } };
}
