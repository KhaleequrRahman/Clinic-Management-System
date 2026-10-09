import { NextRequest, NextResponse } from "next/server";
import { appointmentService } from "@/services/appointmentService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/appointments/:id
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const appointmentId = parseInt(id);
    if (isNaN(appointmentId)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }
    const result = await appointmentService.getAppointmentById(appointmentId);
    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/appointments/:id error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch appointment" }, { status: 500 });
  }
}
