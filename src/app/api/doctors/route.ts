import { NextRequest, NextResponse } from "next/server";
import { doctorService } from "@/services/doctorService";
import type { NewDoctor } from "@/db/schema";
import type { DoctorFilters } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/doctors
 * Get all doctors with optional filters
 * 
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 10)
 * - search: string (search by name, mobile, specialization)
 * - isActive: boolean
 * - specialization: string
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: DoctorFilters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      search: searchParams.get("search") || undefined,
      isActive: searchParams.has("isActive") 
        ? searchParams.get("isActive") === "true" 
        : undefined,
      specialization: searchParams.get("specialization") || undefined,
    };

    const result = await doctorService.getAllDoctors(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/doctors error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doctors
 * Create a new doctor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const doctorData: NewDoctor = {
      name: body.name,
      specialization: body.specialization,
      mobile: body.mobile,
      email: body.email,
      fee: body.fee || "0",
      experience: body.experience ? parseInt(body.experience) : null,
      qualification: body.qualification,
      bio: body.bio,
    };

    const result = await doctorService.registerDoctor(doctorData);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/doctors error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create doctor" },
      { status: 500 }
    );
  }
}
