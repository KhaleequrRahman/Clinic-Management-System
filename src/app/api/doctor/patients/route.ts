import { NextResponse } from "next/server";
import { requireDoctor } from "@/lib/doctorAuth";
import { doctorPortalService } from "@/services/doctorPortalService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireDoctor();
    if ("response" in auth) return auth.response;

    const result = await doctorPortalService.getDoctorPatients(auth.doctorId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/doctor/patients error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
