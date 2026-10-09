"use client";

import Link from "next/link";
import { useState } from "react";
import AppShell from "@/components/AppShell";

export default function NewDoctorPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; login?: { email: string; password: string } } | null>(null);

  if (created) {
    return (
      <AppShell>
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-lg mx-auto">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Doctor Created!</h1>
          <p className="text-gray-600 mb-6">{created.name} has been registered.</p>

          {created.login && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-left mb-6">
              <p className="text-sm font-semibold text-indigo-800 mb-3">🔑 Doctor Portal Login Created</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center bg-white rounded px-3 py-2">
                  <span className="text-gray-500">Email</span>
                  <span className="font-mono font-medium text-gray-900">{created.login.email}</span>
                </div>
                <div className="flex justify-between items-center bg-white rounded px-3 py-2">
                  <span className="text-gray-500">Password</span>
                  <span className="font-mono font-medium text-gray-900">{created.login.password}</span>
                </div>
              </div>
              <p className="text-xs text-indigo-700 mt-3">Share these credentials so the doctor can sign in and manage their appointments.</p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Link href="/doctors" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">Go to Doctors</Link>
            <button onClick={() => setCreated(null)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Add Another</button>
          </div>
        </div>
      </AppShell>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name"), specialization: fd.get("specialization"), mobile: fd.get("mobile"),
      email: fd.get("email") || null, fee: fd.get("fee") || "0",
      experience: fd.get("experience") || null, qualification: fd.get("qualification") || null, bio: fd.get("bio") || null,
    };
    try {
      const res = await fetch("/api/doctors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (!result.success) { setError(result.error); return; }
      setCreated({ name: result.data.name, login: result.login });
    } catch { setError("Unexpected error"); } finally { setLoading(false); }
  }

  return (
    <AppShell>
      <Link href="/doctors" className="text-blue-600 hover:text-blue-700 text-sm">← Back to Doctors</Link>
      <div className="bg-white rounded-xl shadow p-6 mt-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Doctor</h1>
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" name="name" required className="w-full px-4 py-2 border rounded-lg" placeholder="Doctor name" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label><input type="text" name="specialization" required list="specs" className="w-full px-4 py-2 border rounded-lg" /><datalist id="specs"><option value="General Physician"/><option value="Cardiology"/><option value="Dermatology"/><option value="Dentist"/><option value="ENT"/><option value="Gynecology"/><option value="Neurology"/><option value="Ophthalmology"/><option value="Orthopedics"/><option value="Pediatrics"/></datalist></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label><input type="tel" name="mobile" required className="w-full px-4 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="email" className="w-full px-4 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fee (₹)</label><input type="number" name="fee" min="0" step="0.01" defaultValue="500" className="w-full px-4 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label><input type="number" name="experience" min="0" max="70" className="w-full px-4 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label><input type="text" name="qualification" className="w-full px-4 py-2 border rounded-lg" placeholder="MBBS, MD..." /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Bio</label><textarea name="bio" rows={3} className="w-full px-4 py-2 border rounded-lg" /></div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href="/doctors" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Cancel</Link>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">{loading ? "Creating..." : "Create Doctor"}</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
