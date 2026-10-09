import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/authService";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/users — List all users (admin only)
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });

    const result = await authService.getAllUsers();
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}

/**
 * POST /api/users — Create a user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });

    const body = await request.json();
    const result = await authService.createUser({
      email: body.email,
      password: body.password,
      name: body.name,
      mobile: body.mobile,
      role: body.role || "receptionist",
    });

    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
