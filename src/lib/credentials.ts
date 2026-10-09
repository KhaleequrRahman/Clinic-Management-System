import { userRepository } from "@/repositories/userRepository";
import { hashPassword } from "@/lib/auth";

/**
 * Default password assigned to auto-created logins (patients & doctors).
 */
export const DEFAULT_LOGIN_PASSWORD = "welcome123";

/**
 * Build a unique login email for an auto-created user.
 * Uses the provided email (lowercased), or derives one from the mobile number.
 * Appends a numeric suffix if the email is already taken.
 */
export async function resolveUniqueEmail(
  preferred: string | null | undefined,
  mobile: string
): Promise<string> {
  const raw = (preferred && preferred.trim() ? preferred.trim() : `p${mobile}@clinic`).toLowerCase();
  const [local, domain] = raw.includes("@") ? raw.split("@") : [raw, "clinic.local"];
  let candidate = `${local}@${domain}`;
  let n = 1;
  while (await userRepository.findByEmail(candidate)) {
    candidate = `${local}${n}@${domain}`;
    n++;
  }
  return candidate;
}

/**
 * Hash the default password.
 */
export async function defaultPasswordHash(): Promise<string> {
  return hashPassword(DEFAULT_LOGIN_PASSWORD);
}
