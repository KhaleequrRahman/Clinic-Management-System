import { NextRequest, NextResponse } from "next/server";
import { doctorService } from "@/services/doctorService";
import type { NewDoctor } from "@/db/schema";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/doctors/:id
 * Get a single doctor by ID
 */
export async function GET(
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

    const result = await doctorService.getDoctorById(doctorId);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/doctors/:id error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/doctors/:id
 * Update a doctor
 */
export async function PUT(
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

    const body = await request.json();
    
    const updateData: Partial<NewDoctor> = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.specialization !== undefined) updateData.specialization = body.specialization;
    if (body.mobile !== undefined) updateData.mobile = body.mobile;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.fee !== undefined) updateData.fee = body.fee;
    if (body.experience !== undefined) updateData.experience = body.experience ? parseInt(body.experience) : null;
    if (body.qualification !== undefined) updateData.qualification = body.qualification;
    if (body.bio !== undefined) updateData.bio = body.bio;

    const result = await doctorService.updateDoctor(doctorId, updateData);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("PUT /api/doctors/:id error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update doctor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/doctors/:id
 * Deactivate a doctor (soft delete)
 */
export async function DELETE(
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

    const result = await doctorService.deactivateDoctor(doctorId);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/doctors/:id error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deactivate doctor" },
      { status: 500 }
    );
  }
}
