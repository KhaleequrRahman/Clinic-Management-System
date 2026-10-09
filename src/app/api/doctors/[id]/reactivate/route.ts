import { NextRequest, NextResponse } from "next/server";
import { doctorService } from "@/services/doctorService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/doctors/:id/reactivate
 * Reactivate a deactivated doctor
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const doctorId = parseInt(id);
    
    if (isNaN(doctorId)) {
      return NextResponse.json(
        { success: false, error: "Invalid doctor ID" },
        { status: 400 }
      );
    }

    const result = await doctorService.reactivateDoctor(doctorId);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/doctors/:id/reactivate error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reactivate doctor" },
      { status: 500 }
    );
  }
}
