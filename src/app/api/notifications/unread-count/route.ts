import { NextResponse } from "next/server";
import { notificationService } from "@/services/notificationService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await notificationService.getUnreadCount();
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/notifications/unread-count error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
