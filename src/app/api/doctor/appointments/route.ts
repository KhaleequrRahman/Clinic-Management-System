import { NextRequest, NextResponse } from "next/server";
import { requireDoctor } from "@/lib/doctorAuth";
import { doctorPortalService } from "@/services/doctorPortalService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireDoctor();
    if ("response" in auth) return auth.response;

    const sp = request.nextUrl.searchParams;
    const result = await doctorPortalService.getDoctorAppointments(auth.doctorId, {
      date: sp.get("date") || undefined,
      status: sp.get("status") || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/doctor/appointments error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
