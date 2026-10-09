import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "clinic-cms-secret-key-change-in-production-2024"
);
const COOKIE_NAME = "cms_session";

// Public paths (no auth needed)
const PUBLIC_PREFIXES = ["/login", "/signup", "/api/auth/", "/api/health", "/_next", "/favicon"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (pathname === "/") return NextResponse.next();
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();

  // Check session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify token
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // ─── PATIENT ROLE: only patient portal + read-only booking APIs ───
    if (role === "patient") {
      const allowedPrefixes = [
        "/portal",
        "/api/portal/",
        "/api/doctors", // browse doctors for booking
        "/api/appointments/slots", // check time slots
        "/prescriptions/", // view own prescription details
      ];
      const isAllowed = allowedPrefixes.some((p) => pathname.startsWith(p));
      if (!isAllowed) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/portal", request.url));
      }
      return NextResponse.next();
    }

    // ─── DOCTOR ROLE: only doctor portal (scoped to their own data) ───
    if (role === "doctor") {
      const allowedPrefixes = ["/doctor", "/api/doctor/"];
      const isAllowed = allowedPrefixes.some((p) => pathname.startsWith(p));
      if (!isAllowed) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/doctor", request.url));
      }
      return NextResponse.next();
    }

    // ─── ADMIN: full access ───
    if (role === "admin") {
      return NextResponse.next();
    }

    // ─── RECEPTIONIST: staff area except admin settings ───
    if (role === "receptionist") {
      if (pathname.startsWith("/settings") || pathname.startsWith("/api/users") || pathname.startsWith("/api/audit")) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.next();
    }

    // Unknown role → reject
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
