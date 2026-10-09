"use client";

import Link from "next/link";
import { useState } from "react";
import AppShell from "@/components/AppShell";

export default function NewPatientPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; login?: { email: string; password: string } } | null>(null);

  if (created) {
    return (
      <AppShell>
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-lg mx-auto">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Created!</h1>
          <p className="text-gray-600 mb-6">{created.name} has been registered.</p>

          {created.login && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left mb-6">
              <p className="text-sm font-semibold text-green-800 mb-3">🔑 Portal Login Created</p>
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
              <p className="text-xs text-green-700 mt-3">Share these credentials with the patient so they can sign in and book appointments.</p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Link href="/patients" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">Go to Patients</Link>
            <button onClick={() => setCreated(null)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Add Another</button>
          </div>
        </div>
      </AppShell>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name"), mobile: fd.get("mobile"), email: fd.get("email") || null,
      age: fd.get("age") || null, gender: fd.get("gender") || null,
      bloodGroup: fd.get("bloodGroup") || null, address: fd.get("address") || null,
      emergencyContact: fd.get("emergencyContact") || null,
      medicalHistory: fd.get("medicalHistory") || null, allergies: fd.get("allergies") || null,
    };

    try {
      const res = await fetch("/api/patients", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) { setError(result.error || "Failed to create patient"); return; }
      setCreated({ name: result.data.name, login: result.login });
    } catch { setError("An unexpected error occurred"); } finally { setLoading(false); }
  }

  return (
    <AppShell>
      <Link href="/patients" className="text-blue-600 hover:text-blue-700 text-sm">← Back to Patients</Link>
      <div className="bg-white rounded-xl shadow p-6 mt-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Patient</h1>
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter patient name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile <span className="text-red-500">*</span></label>
              <input type="tel" name="mobile" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mobile number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email address" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="number" name="age" min="0" max="150" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select name="gender" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
              <select name="bloodGroup" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option><option value="unknown">Unknown</option></select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
              <input type="tel" name="emergencyContact" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea name="address" rows={2} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
              <textarea name="medicalHistory" rows={2} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Past conditions, surgeries..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
              <textarea name="allergies" rows={2} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href="/patients" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Cancel</Link>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">{loading ? "Creating..." : "Create Patient"}</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
