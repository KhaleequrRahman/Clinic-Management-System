import { NextRequest, NextResponse } from "next/server";
import { patientService } from "@/services/patientService";
import type { NewPatient } from "@/db/schema";
import type { PatientFilters } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/patients
 * Get all patients with optional filters
 * 
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 10)
 * - search: string (search by name, mobile, email)
 * - isActive: boolean
 * - gender: male | female | other
 * - bloodGroup: string
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: PatientFilters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      search: searchParams.get("search") || undefined,
      isActive: searchParams.has("isActive") 
        ? searchParams.get("isActive") === "true" 
        : undefined,
      gender: searchParams.get("gender") as "male" | "female" | "other" | undefined,
      bloodGroup: searchParams.get("bloodGroup") || undefined,
    };

    const result = await patientService.getAllPatients(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/patients error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/patients
 * Create a new patient
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const patientData: NewPatient = {
      name: body.name,
      mobile: body.mobile,
      email: body.email,
      age: body.age ? parseInt(body.age) : null,
      gender: body.gender,
      bloodGroup: body.bloodGroup,
      address: body.address,
      emergencyContact: body.emergencyContact,
      medicalHistory: body.medicalHistory,
      allergies: body.allergies,
    };

    const result = await patientService.registerPatient(patientData);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/patients error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create patient" },
      { status: 500 }
    );
  }
}
