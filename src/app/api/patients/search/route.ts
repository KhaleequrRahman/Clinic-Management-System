import { NextRequest, NextResponse } from "next/server";
import { patientService } from "@/services/patientService";

export const dynamic = "force-dynamic";

/**
 * GET /api/patients/search?q=query&limit=10
 * Search patients by name or mobile
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Search query is required" },
        { status: 400 }
      );
    }

    const result = await patientService.searchPatients(query, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/patients/search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search patients" },
      { status: 500 }
    );
  }
}
