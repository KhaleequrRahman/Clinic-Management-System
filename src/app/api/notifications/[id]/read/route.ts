import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/services/notificationService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await notificationService.markAsRead(parseInt(id));
    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/notifications/:id/read error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
