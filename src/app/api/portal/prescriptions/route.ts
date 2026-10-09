import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prescriptionService } from "@/services/prescriptionService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "patient" || !session.patientId) {
      return NextResponse.json({ success: false, error: "Not a patient" }, { status: 403 });
    }
    const result = await prescriptionService.getPatientPrescriptions(session.patientId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/portal/prescriptions error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
