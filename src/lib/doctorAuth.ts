import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { doctorRepository } from "@/repositories/doctorRepository";

export interface DoctorSession {
  doctorId: number;
  userId: number;
}

/**
 * Resolve the logged-in doctor from the session.
 * Returns { doctor } on success, or { response } to send back (401/403/404).
 */
export async function requireDoctor(): Promise<
  | { doctorId: number; userId: number }
  | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 }) };
  }
  if (session.role !== "doctor") {
    return { response: NextResponse.json({ success: false, error: "Doctor access required" }, { status: 403 }) };
  }
  const doctor = await doctorRepository.findByUserId(session.userId);
  if (!doctor) {
    return { response: NextResponse.json({ success: false, error: "No doctor profile linked" }, { status: 404 }) };
  }
  return { doctorId: doctor.id, userId: session.userId };
}
