import { NextResponse } from "next/server";
import { patientService } from "@/services/patientService";

export const dynamic = "force-dynamic";

/**
 * GET /api/patients/stats
 * Get patient statistics
 */
export async function GET() {
  try {
    const result = await patientService.getPatientStats();
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/patients/stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patient stats" },
      { status: 500 }
    );
  }
}
