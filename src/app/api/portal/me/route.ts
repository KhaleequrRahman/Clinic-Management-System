import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { patientRepository } from "@/repositories/patientRepository";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/me — Get current patient's full profile
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "patient" || !session.patientId) {
      return NextResponse.json({ success: false, error: "Not a patient" }, { status: 403 });
    }

    const patient = await patientRepository.findById(session.patientId);
    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: patient });
  } catch (error) {
    console.error("GET /api/portal/me error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
