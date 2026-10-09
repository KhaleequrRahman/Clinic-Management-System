"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import type { Doctor } from "@/db/schema";

export default function EditDoctorPage() {
  const params = useParams();
  const doctorId = params.id as string;
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/doctors/${doctorId}`).then((r) => r.json()).then((res) => {
      if (res.success) setDoctor(res.data); else setError(res.error);
    }).catch(() => setError("Failed to load")).finally(() => setLoading(false));
  }, [doctorId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name"), specialization: fd.get("specialization"), mobile: fd.get("mobile"),
      email: fd.get("email") || null, fee: fd.get("fee") || "0",
      experience: fd.get("experience") || null, qualification: fd.get("qualification") || null, bio: fd.get("bio") || null,
    };
    try {
      const res = await fetch(`/api/doctors/${doctorId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (!result.success) { setError(result.error); return; }
      window.location.href = `/doctors/${doctorId}`;
    } catch { setError("Unexpected error"); } finally { setSaving(false); }
  }

  if (loading) return <AppShell><div className="py-12 text-center text-gray-500">Loading...</div></AppShell>;
  if (!doctor) return <AppShell><div className="py-12 text-center"><p className="text-red-500 mb-4">{error || "Not found"}</p><Link href="/doctors" className="text-blue-600">Back</Link></div></AppShell>;

  const disabled = !doctor.isActive;

  return (
    <AppShell>
      <Link href={`/doctors/${doctorId}`} className="text-blue-600 hover:text-blue-700 text-sm">← Back to Doctor</Link>
      <div className="bg-white rounded-xl shadow p-6 mt-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Doctor</h1>
        {disabled && <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">This doctor is inactive. Reactivate to edit.</div>}
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" name="name" required defaultValue={doctor.name} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label><input type="text" name="specialization" required defaultValue={doctor.specialization} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label><input type="tel" name="mobile" required defaultValue={doctor.mobile} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="email" defaultValue={doctor.email || ""} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fee (₹)</label><input type="number" name="fee" min="0" step="0.01" defaultValue={doctor.fee} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label><input type="number" name="experience" min="0" max="70" defaultValue={doctor.experience || ""} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label><input type="text" name="qualification" defaultValue={doctor.qualification || ""} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Bio</label><textarea name="bio" rows={3} defaultValue={doctor.bio || ""} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href={`/doctors/${doctorId}`} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Cancel</Link>
            <button type="submit" disabled={saving || disabled} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
