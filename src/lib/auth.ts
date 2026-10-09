import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// ============================================
// AUTH UTILITIES
// ============================================

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "clinic-cms-secret-key-change-in-production-2024"
);
const COOKIE_NAME = "cms_session";
const SESSION_DURATION = 60 * 60 * 24; // 24 hours in seconds

export interface SessionPayload {
  userId: number;
  email: string;
  name: string;
  role: "admin" | "receptionist" | "doctor" | "patient";
  patientId?: number; // set when role is "patient"
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a JWT token
 */
export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

/**
 * Get current session from cookie
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Clear session cookie (logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Check if user has required role
 */
export function hasRole(
  session: SessionPayload,
  allowedRoles: string[]
): boolean {
  return allowedRoles.includes(session.role);
}

/**
 * Require authentication — returns session or null
 * Use in server components / API routes
 */
export async function requireAuth(): Promise<SessionPayload | null> {
  return getSession();
}
