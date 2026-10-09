import { NextRequest, NextResponse } from "next/server";
import { billingService } from "@/services/billingService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const result = await billingService.getAllInvoices({
      patientId: sp.get("patientId") ? parseInt(sp.get("patientId")!) : undefined,
      status: sp.get("status") || undefined,
      fromDate: sp.get("fromDate") || undefined,
      toDate: sp.get("toDate") || undefined,
      page: parseInt(sp.get("page") || "1"),
      limit: parseInt(sp.get("limit") || "10"),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await billingService.createInvoice({
      patientId: parseInt(body.patientId),
      appointmentId: body.appointmentId ? parseInt(body.appointmentId) : undefined,
      doctorId: body.doctorId ? parseInt(body.doctorId) : undefined,
      discount: body.discount ? parseFloat(body.discount) : 0,
      tax: body.tax ? parseFloat(body.tax) : 0,
      notes: body.notes,
      dueDate: body.dueDate,
      items: body.items || [],
    });
    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/invoices error:", error);
    return NextResponse.json({ success: false, error: "Failed to create invoice" }, { status: 500 });
  }
}
