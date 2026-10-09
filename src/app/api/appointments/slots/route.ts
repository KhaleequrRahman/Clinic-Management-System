import { NextRequest, NextResponse } from "next/server";
import { appointmentService } from "@/services/appointmentService";

export const dynamic = "force-dynamic";

/**
 * GET /api/appointments/slots?doctorId=1&date=2025-08-20
 * Returns available time slots for a doctor on a given date
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const doctorId = sp.get("doctorId");
    const date = sp.get("date");

    if (!doctorId || !date) {
      return NextResponse.json(
        { success: false, error: "doctorId and date are required" },
        { status: 400 }
      );
    }

    const result = await appointmentService.getAvailableSlots(parseInt(doctorId), date);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/appointments/slots error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch slots" }, { status: 500 });
  }
}
