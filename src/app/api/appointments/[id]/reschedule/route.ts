import { NextRequest, NextResponse } from "next/server";
import { appointmentService } from "@/services/appointmentService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PUT /api/appointments/:id/reschedule
 * { "appointmentDate": "2025-08-20", "appointmentTime": "10:00" }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const appointmentId = parseInt(id);
    if (isNaN(appointmentId)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }

    const body = await request.json();
    if (!body.appointmentDate || !body.appointmentTime) {
      return NextResponse.json({ success: false, error: "Date and time are required" }, { status: 400 });
    }

    const result = await appointmentService.rescheduleAppointment(
      appointmentId,
      body.appointmentDate,
      body.appointmentTime
    );
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("PUT /api/appointments/:id/reschedule error:", error);
    return NextResponse.json({ success: false, error: "Failed to reschedule" }, { status: 500 });
  }
}
