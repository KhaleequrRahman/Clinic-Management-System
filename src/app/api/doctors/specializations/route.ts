import { NextResponse } from "next/server";
import { doctorService } from "@/services/doctorService";

export const dynamic = "force-dynamic";

/**
 * GET /api/doctors/specializations
 * Get all unique specializations
 */
export async function GET() {
  try {
    const result = await doctorService.getSpecializations();
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/doctors/specializations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch specializations" },
      { status: 500 }
    );
  }
}
