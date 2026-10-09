import { NextRequest, NextResponse } from "next/server";
import { patientService } from "@/services/patientService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/patients/:id/reactivate
 * Reactivate a deactivated patient
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const patientId = parseInt(id);
    
    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    const result = await patientService.reactivatePatient(patientId);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/patients/:id/reactivate error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reactivate patient" },
      { status: 500 }
    );
  }
}
