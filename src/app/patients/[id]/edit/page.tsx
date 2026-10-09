"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import type { Patient } from "@/db/schema";

export default function EditPatientPage() {
  const params = useParams();
  const patientId = params.id as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/patients/${patientId}`).then((r) => r.json()).then((res) => {
      if (res.success) setPatient(res.data); else setError(res.error);
    }).catch(() => setError("Failed to load")).finally(() => setLoading(false));
  }, [patientId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name"), mobile: fd.get("mobile"), email: fd.get("email") || null,
      age: fd.get("age") || null, gender: fd.get("gender") || null,
      bloodGroup: fd.get("bloodGroup") || null, address: fd.get("address") || null,
      emergencyContact: fd.get("emergencyContact") || null,
      medicalHistory: fd.get("medicalHistory") || null, allergies: fd.get("allergies") || null,
    };
    try {
      const res = await fetch(`/api/patients/${patientId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (!result.success) { setError(result.error); return; }
      window.location.href = `/patients/${patientId}`;
    } catch { setError("Unexpected error"); } finally { setSaving(false); }
  }

  if (loading) return <AppShell><div className="py-12 text-center text-gray-500">Loading...</div></AppShell>;
  if (!patient) return <AppShell><div className="py-12 text-center"><p className="text-red-500 mb-4">{error || "Not found"}</p><Link href="/patients" className="text-blue-600">Back</Link></div></AppShell>;

  const disabled = !patient.isActive;

  return (
    <AppShell>
      <Link href={`/patients/${patientId}`} className="text-blue-600 hover:text-blue-700 text-sm">← Back to Patient</Link>
      <div className="bg-white rounded-xl shadow p-6 mt-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Patient</h1>
        {disabled && <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">This patient is inactive. Reactivate to edit.</div>}
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" name="name" required defaultValue={patient.name} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label><input type="tel" name="mobile" required defaultValue={patient.mobile} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="email" defaultValue={patient.email || ""} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Age</label><input type="number" name="age" min="0" max="150" defaultValue={patient.age || ""} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select name="gender" defaultValue={patient.gender || ""} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label><select name="bloodGroup" defaultValue={patient.bloodGroup || ""} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"><option value="">Select</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option><option value="unknown">Unknown</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label><input type="tel" name="emergencyContact" defaultValue={patient.emergencyContact || ""} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea name="address" rows={2} defaultValue={patient.address || ""} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label><textarea name="medicalHistory" rows={2} defaultValue={patient.medicalHistory || ""} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label><textarea name="allergies" rows={2} defaultValue={patient.allergies || ""} disabled={disabled} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100" /></div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href={`/patients/${patientId}`} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Cancel</Link>
            <button type="submit" disabled={saving || disabled} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
