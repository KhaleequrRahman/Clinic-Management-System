import { NextRequest, NextResponse } from "next/server";
import { appointmentService } from "@/services/appointmentService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PUT /api/appointments/:id/status
 * { "status": "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show" }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const appointmentId = parseInt(id);
    if (isNaN(appointmentId)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }

    const body = await request.json();
    if (!body.status) {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 });
    }

    const result = await appointmentService.updateStatus(appointmentId, body.status);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("PUT /api/appointments/:id/status error:", error);
    return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 });
  }
}
