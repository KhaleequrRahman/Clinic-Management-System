"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name"), email: fd.get("email"), password: fd.get("password"),
      mobile: fd.get("mobile"), age: fd.get("age") || undefined, gender: fd.get("gender") || undefined,
    };

    if (data.password !== fd.get("confirmPassword")) { setError("Passwords do not match"); setLoading(false); return; }

    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (!result.success) { setError(result.error || "Registration failed"); return; }
      window.location.href = "/portal";
    } catch { setError("An unexpected error occurred"); } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-5 sm:mb-6">
          <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-green-600 text-white mb-3">
            <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Patient Registration</h1>
          <p className="text-gray-500 mt-1 text-sm">Create your account to book appointments</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-5 sm:p-8">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" required className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base" placeholder="Your full name" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile <span className="text-red-500">*</span></label>
                <input type="tel" name="mobile" required className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base" placeholder="9876543210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" required className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base" placeholder="you@email.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input type="number" name="age" min="1" max="150" className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select name="gender" className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
              <input type="password" name="password" required minLength={6} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base" placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
              <input type="password" name="confirmPassword" required minLength={6} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base" placeholder="Re-enter password" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 text-base mt-1">
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account? <Link href="/login" className="text-green-600 hover:underline font-medium">Sign In</Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">
          <Link href="/" className="hover:underline">← Back to Home</Link>
        </p>
      </div>
    </main>
  );
}
