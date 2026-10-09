import { NextRequest, NextResponse } from "next/server";
import { requireDoctor } from "@/lib/doctorAuth";
import { doctorPortalService } from "@/services/doctorPortalService";
import { appointmentRepository } from "@/repositories/appointmentRepository";
import { prescriptionRepository } from "@/repositories/prescriptionRepository";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireDoctor();
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const appointmentId = parseInt(id);
    if (isNaN(appointmentId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const owned = await doctorPortalService.assertDoctorOwns(auth.doctorId, appointmentId);
    if (!owned) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    const detail = await appointmentRepository.findByIdWithRelations(appointmentId);
    if (!detail) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    // Check for existing prescription
    const existingRx = await prescriptionRepository.findByAppointmentId(appointmentId);

    return NextResponse.json({ success: true, data: detail, prescription: existingRx });
  } catch (error) {
    console.error("GET /api/doctor/appointments/:id error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
