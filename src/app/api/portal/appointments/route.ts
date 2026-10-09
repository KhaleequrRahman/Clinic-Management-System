import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { appointmentService } from "@/services/appointmentService";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/appointments — Get current patient's appointments
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "patient" || !session.patientId) {
      return NextResponse.json({ success: false, error: "Not a patient" }, { status: 403 });
    }

    const result = await appointmentService.getPatientAppointments(session.patientId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/portal/appointments error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}

/**
 * POST /api/portal/appointments — Patient books their own appointment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "patient" || !session.patientId) {
      return NextResponse.json({ success: false, error: "Not a patient" }, { status: 403 });
    }

    const body = await request.json();

    const result = await appointmentService.createAppointment({
      patientId: session.patientId, // always their own
      doctorId: parseInt(body.doctorId),
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime,
      reason: body.reason,
      notes: body.notes,
    });

    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/portal/appointments error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
