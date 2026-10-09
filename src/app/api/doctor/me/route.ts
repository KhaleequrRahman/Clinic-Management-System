import { NextResponse } from "next/server";
import { requireDoctor } from "@/lib/doctorAuth";
import { doctorPortalService } from "@/services/doctorPortalService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireDoctor();
    if ("response" in auth) return auth.response;

    const [profile, stats] = await Promise.all([
      doctorPortalService.getDoctorByUserId(auth.userId),
      doctorPortalService.getDoctorStats(auth.doctorId),
    ]);

    if (!profile.success) return NextResponse.json(profile, { status: 404 });
    return NextResponse.json({ success: true, data: profile.data, stats: stats.data });
  } catch (error) {
    console.error("GET /api/doctor/me error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
