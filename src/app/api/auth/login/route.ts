import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/repositories/userRepository";
import { patientRepository } from "@/repositories/patientRepository";
import { verifyPassword, createToken } from "@/lib/auth";
import { auditService } from "@/services/auditService";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "cms_session";
const SESSION_DURATION = 60 * 60 * 24; // 24 hours

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ success: false, error: "Password is required" }, { status: 400 });
    }

    const user = await userRepository.findByEmail(email.trim().toLowerCase());
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, error: "Account is deactivated. Contact administrator." }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    // If patient role, find their patientId
    let patientId: number | undefined;
    if (user.role === "patient") {
      // Find patient record linked to this user
      const patients = await patientRepository.findByUserId(user.id);
      if (patients) patientId = patients.id;
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      patientId,
    });

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Audit log
    auditService.log({
      userId: user.id,
      action: "LOGIN",
      tableName: "users",
      recordId: user.id,
      newValues: { email: user.email, role: user.role },
    });

    // Build response with Set-Cookie header
    const { password: _, ...safeUser } = user;
    const response = NextResponse.json({
      success: true,
      data: { ...safeUser, patientId },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
  }
}
