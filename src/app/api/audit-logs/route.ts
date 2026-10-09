import { NextRequest, NextResponse } from "next/server";
import { auditService } from "@/services/auditService";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });

    const sp = request.nextUrl.searchParams;
    const result = await auditService.getAuditLogs({
      page: parseInt(sp.get("page") || "1"),
      limit: parseInt(sp.get("limit") || "30"),
      tableName: sp.get("tableName") || undefined,
      userId: sp.get("userId") ? parseInt(sp.get("userId")!) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/audit-logs error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
