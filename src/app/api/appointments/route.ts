import { NextRequest, NextResponse } from "next/server";
import { appointmentService } from "@/services/appointmentService";
import type { AppointmentFilters } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/appointments
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;

    const filters: AppointmentFilters = {
      page: parseInt(sp.get("page") || "1"),
      limit: parseInt(sp.get("limit") || "10"),
      patientId: sp.get("patientId") ? parseInt(sp.get("patientId")!) : undefined,
      doctorId: sp.get("doctorId") ? parseInt(sp.get("doctorId")!) : undefined,
      status: sp.get("status") || undefined,
      fromDate: sp.get("fromDate") || undefined,
      toDate: sp.get("toDate") || undefined,
    };

    const result = await appointmentService.getAllAppointments(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/appointments error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch appointments" }, { status: 500 });
  }
}

/**
 * POST /api/appointments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await appointmentService.createAppointment({
      patientId: parseInt(body.patientId),
      doctorId: parseInt(body.doctorId),
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime,
      reason: body.reason,
      notes: body.notes,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/appointments error:", error);
    return NextResponse.json({ success: false, error: "Failed to create appointment" }, { status: 500 });
  }
}
