import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { doctorRepository } from "@/repositories/doctorRepository";
import { appointmentRepository } from "@/repositories/appointmentRepository";
import { prescriptionService } from "@/services/prescriptionService";

export const dynamic = "force-dynamic";

/**
 * POST /api/doctor/prescriptions — Doctor creates prescription for their own appointment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "doctor") {
      return NextResponse.json({ success: false, error: "Not a doctor" }, { status: 403 });
    }

    const doctor = await doctorRepository.findByUserId(session.userId);
    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const appointmentId = parseInt(body.appointmentId);

    // Ownership check
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    if (appointment.doctorId !== doctor.id) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const result = await prescriptionService.createPrescription({
      appointmentId,
      diagnosis: body.diagnosis,
      notes: body.notes,
      followUpInstructions: body.followUpInstructions,
      items: body.items || [],
    });

    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/doctor/prescriptions error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
