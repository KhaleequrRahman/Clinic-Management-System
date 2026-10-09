import { NextResponse } from "next/server";
import { notificationService } from "@/services/notificationService";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await notificationService.markAllAsRead();
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/notifications/mark-all-read error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
