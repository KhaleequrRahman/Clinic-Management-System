import { NextRequest, NextResponse } from "next/server";
import { requireDoctor } from "@/lib/doctorAuth";
import { doctorPortalService } from "@/services/doctorPortalService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireDoctor();
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const appointmentId = parseInt(id);
    if (isNaN(appointmentId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    if (!body.status) {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 });
    }

    const result = await doctorPortalService.updateOwnAppointmentStatus(auth.doctorId, appointmentId, body.status);
    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("PUT /api/doctor/appointments/:id/status error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
