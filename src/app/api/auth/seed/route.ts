import { NextResponse } from "next/server";
import { authService } from "@/services/authService";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/seed
 * Seeds the initial admin user if no users exist
 */
export async function POST() {
  try {
    const seeded = await authService.seedAdminIfNeeded();
    if (seeded) {
      return NextResponse.json({
        success: true,
        message: "Admin user created. Email: admin@clinic.com, Password: admin123",
      });
    }
    return NextResponse.json({
      success: true,
      message: "Users already exist. No seed needed.",
    });
  } catch (error) {
    console.error("POST /api/auth/seed error:", error);
    return NextResponse.json({ success: false, error: "Seed failed" }, { status: 500 });
  }
}
