import { NextRequest, NextResponse } from "next/server";
import { appointmentService } from "@/services/appointmentService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PUT /api/appointments/:id/consultation
 * Save consultation data (symptoms, diagnosis, notes, vitals, followUpDate)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const appointmentId = parseInt(id);
    if (isNaN(appointmentId)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }

    const body = await request.json();

    const result = await appointmentService.saveConsultation(appointmentId, {
      symptoms: body.symptoms,
      diagnosis: body.diagnosis,
      notes: body.notes,
      vitals: body.vitals ? JSON.stringify(body.vitals) : undefined,
      followUpDate: body.followUpDate,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("PUT /api/appointments/:id/consultation error:", error);
    return NextResponse.json({ success: false, error: "Failed to save consultation" }, { status: 500 });
  }
}
