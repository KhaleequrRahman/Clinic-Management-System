import { NextResponse } from "next/server";
import { appointmentService } from "@/services/appointmentService";

export const dynamic = "force-dynamic";

/**
 * GET /api/appointments/stats
 */
export async function GET() {
  try {
    const result = await appointmentService.getAppointmentStats();
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/appointments/stats error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
