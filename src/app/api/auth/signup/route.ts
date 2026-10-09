import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/repositories/userRepository";
import { patientRepository } from "@/repositories/patientRepository";
import { hashPassword, createToken } from "@/lib/auth";
import { db } from "@/db";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "cms_session";
const SESSION_DURATION = 60 * 60 * 24;

/**
 * POST /api/auth/signup
 * Patient self-registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, mobile, age, gender } = body;

    // Validate
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (!mobile || !mobile.trim()) {
      return NextResponse.json({ success: false, error: "Mobile number is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMobile = mobile.trim().replace(/\s+/g, "");

    // Check duplicate email
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email is already registered" }, { status: 400 });
    }

    // Check duplicate mobile in patients
    const existingPatient = await patientRepository.findByMobile(normalizedMobile);
    if (existingPatient) {
      return NextResponse.json({
        success: false,
        error: `Mobile number ${normalizedMobile} is already registered. Please contact the clinic if this is your number.`,
      }, { status: 400 });
    }

    // Create user + patient in a transaction
    const hashed = await hashPassword(password);

    const user = await userRepository.create({
      email: normalizedEmail,
      password: hashed,
      name: name.trim(),
      mobile: normalizedMobile,
      role: "patient",
    });

    const patient = await patientRepository.create({
      userId: user.id,
      name: name.trim(),
      mobile: normalizedMobile,
      email: normalizedEmail,
      age: age ? parseInt(age) : null,
      gender: gender || null,
    });

    // Create JWT and set cookie
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: "patient",
      patientId: patient.id,
    });

    const { password: _, ...safeUser } = user;
    const response = NextResponse.json({
      success: true,
      data: { ...safeUser, patientId: patient.id },
    }, { status: 201 });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/signup error:", error);
    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 });
  }
}
