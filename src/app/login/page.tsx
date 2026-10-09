"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/seed", { method: "POST" }).then((r) => r.json()).then((res) => {
      if (res.message?.includes("Admin user created")) setSeedMessage("Default admin created: admin@clinic.com / admin123");
    }).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!result.success) { setError(result.error || "Login failed"); return; }
      const role = result.data?.role;
      if (role === "patient") {
        window.location.href = "/portal";
      } else if (role === "doctor") {
        window.location.href = "/doctor";
      } else {
        window.location.href = "/dashboard";
      }
    } catch { setError("An unexpected error occurred"); } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-blue-600 text-white mb-3 sm:mb-4">
            <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Clinic Management System</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Sign in to your account</p>
        </div>

        {seedMessage && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">{seedMessage}</div>}

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" placeholder="admin@clinic.com" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 text-base">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center">Default: <strong>admin@clinic.com</strong> / <strong>admin123</strong></p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          New patient? <Link href="/signup" className="text-blue-600 hover:underline font-medium">Create an account</Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">
          <Link href="/" className="hover:underline">← Back to Home</Link>
        </p>
      </div>
    </main>
  );
}
