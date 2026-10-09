import { NextRequest, NextResponse } from "next/server";
import { prescriptionService } from "@/services/prescriptionService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const result = await prescriptionService.getAllPrescriptions({
      patientId: sp.get("patientId") ? parseInt(sp.get("patientId")!) : undefined,
      doctorId: sp.get("doctorId") ? parseInt(sp.get("doctorId")!) : undefined,
      page: parseInt(sp.get("page") || "1"),
      limit: parseInt(sp.get("limit") || "10"),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/prescriptions error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch prescriptions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await prescriptionService.createPrescription({
      appointmentId: parseInt(body.appointmentId),
      diagnosis: body.diagnosis,
      notes: body.notes,
      followUpInstructions: body.followUpInstructions,
      items: body.items || [],
    });
    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/prescriptions error:", error);
    return NextResponse.json({ success: false, error: "Failed to create prescription" }, { status: 500 });
  }
}
