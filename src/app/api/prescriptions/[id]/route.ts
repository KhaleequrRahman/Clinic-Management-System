import { NextRequest, NextResponse } from "next/server";
import { prescriptionService } from "@/services/prescriptionService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const prescriptionId = parseInt(id);
    if (isNaN(prescriptionId)) return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    const result = await prescriptionService.getPrescriptionById(prescriptionId);
    if (!result.success) return NextResponse.json(result, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/prescriptions/:id error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch prescription" }, { status: 500 });
  }
}
