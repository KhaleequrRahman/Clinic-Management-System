import { NextResponse } from "next/server";
import { billingService } from "@/services/billingService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await billingService.getRevenueStats();
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/invoices/stats error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
