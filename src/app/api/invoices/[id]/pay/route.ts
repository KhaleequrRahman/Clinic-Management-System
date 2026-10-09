import { NextRequest, NextResponse } from "next/server";
import { billingService } from "@/services/billingService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/invoices/:id/pay
 * Record a payment against an invoice
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

    const body = await request.json();

    const result = await billingService.recordPayment({
      invoiceId,
      amount: parseFloat(body.amount),
      paymentMethod: body.paymentMethod || "cash",
      transactionId: body.transactionId,
      notes: body.notes,
    });

    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/invoices/:id/pay error:", error);
    return NextResponse.json({ success: false, error: "Failed to record payment" }, { status: 500 });
  }
}
