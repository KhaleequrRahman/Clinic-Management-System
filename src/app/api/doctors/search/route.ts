import { NextRequest, NextResponse } from "next/server";
import { doctorService } from "@/services/doctorService";

export const dynamic = "force-dynamic";

/**
 * GET /api/doctors/search?q=query&limit=10
 * Search doctors by name or specialization
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

    const result = await doctorService.searchDoctors(query, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/doctors/search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search doctors" },
      { status: 500 }
    );
  }
}
