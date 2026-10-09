import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "cms_session";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 });
  }
}
