import { NextRequest, NextResponse } from "next/server";
import { billingService } from "@/services/billingService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    const result = await billingService.getInvoiceById(invoiceId);
    if (!result.success) return NextResponse.json(result, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/invoices/:id error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch invoice" }, { status: 500 });
  }
}
