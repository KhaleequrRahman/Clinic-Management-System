import { NextRequest, NextResponse } from "next/server";
import { patientService } from "@/services/patientService";
import type { NewPatient } from "@/db/schema";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/patients/:id
 * Get a single patient by ID
 */
export async function GET(
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

    const result = await patientService.getPatientById(patientId);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/patients/:id error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/patients/:id
 * Update a patient
 */
export async function PUT(
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

    const body = await request.json();
    
    const updateData: Partial<NewPatient> = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.mobile !== undefined) updateData.mobile = body.mobile;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.age !== undefined) updateData.age = body.age ? parseInt(body.age) : null;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.emergencyContact !== undefined) updateData.emergencyContact = body.emergencyContact;
    if (body.medicalHistory !== undefined) updateData.medicalHistory = body.medicalHistory;
    if (body.allergies !== undefined) updateData.allergies = body.allergies;

    const result = await patientService.updatePatient(patientId, updateData);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("PUT /api/patients/:id error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update patient" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/patients/:id
 * Deactivate a patient (soft delete)
 */
export async function DELETE(
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

    const result = await patientService.deactivatePatient(patientId);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/patients/:id error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deactivate patient" },
      { status: 500 }
    );
  }
}
