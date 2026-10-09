import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { doctorRepository } from "@/repositories/doctorRepository";
import { patientRepository } from "@/repositories/patientRepository";
import { appointmentRepository } from "@/repositories/appointmentRepository";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/doctor/patients/:id — Patient detail + their visits to this doctor
 * (Only accessible if the patient has visited this doctor)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session || session.role !== "doctor") {
      return NextResponse.json({ success: false, error: "Not a doctor" }, { status: 403 });
    }

    const doctor = await doctorRepository.findByUserId(session.userId);
    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor profile not found" }, { status: 404 });
    }

    const { id } = await params;
    const patientId = parseInt(id);

    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
    }

    // Verify this patient has visited this doctor
    const visits = await appointmentRepository.getPatientAppointmentsWithDoctor(doctor.id, patientId);
    if (visits.length === 0) {
      return NextResponse.json({ success: false, error: "This patient has no visits with you" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: { patient, visits } });
  } catch (error) {
    console.error("GET /api/doctor/patients/:id error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
