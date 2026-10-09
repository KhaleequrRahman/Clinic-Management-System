import { NextResponse } from "next/server";
import { doctorService } from "@/services/doctorService";

export const dynamic = "force-dynamic";

/**
 * GET /api/doctors/stats
 * Get doctor statistics
 */
export async function GET() {
  try {
    const result = await doctorService.getDoctorStats();
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/doctors/stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctor stats" },
      { status: 500 }
    );
  }
}
