import { NextRequest, NextResponse } from "next/server";
import { appointmentService } from "@/services/appointmentService";

export const dynamic = "force-dynamic";

/**
 * GET /api/appointments/today?doctorId=1
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const doctorId = sp.get("doctorId") ? parseInt(sp.get("doctorId")!) : undefined;

    const result = await appointmentService.getTodayAppointments(doctorId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/appointments/today error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch today appointments" }, { status: 500 });
  }
}
