import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/services/notificationService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const result = await notificationService.getAllNotifications({
      page: parseInt(sp.get("page") || "1"),
      limit: parseInt(sp.get("limit") || "20"),
      isRead: sp.has("isRead") ? sp.get("isRead") === "true" : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
