"use client";

import { useState, useEffect } from "react";
import PatientPortalShell from "@/components/PatientPortalShell";

export default function MyProfilePage() {
  const [patient, setPatient] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/me").then((r) => r.json()).then((res) => {
      if (res.success) setPatient(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PatientPortalShell><div className="py-12 text-center text-gray-500">Loading...</div></PatientPortalShell>;
  if (!patient) return <PatientPortalShell><div className="py-12 text-center text-red-500">Could not load profile.</div></PatientPortalShell>;

  return (
    <PatientPortalShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-600 text-2xl font-bold">
              {(patient.name as string).charAt(0).toUpperCase()}
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">{patient.name as string}</h2>
              <p className="text-green-100">Patient ID: {patient.id as number}</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Contact</h3>
            <div><p className="text-xs text-gray-500">Mobile</p><p className="font-medium">{patient.mobile as string}</p></div>
            <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{(patient.email as string) || "-"}</p></div>
            <div><p className="text-xs text-gray-500">Emergency Contact</p><p className="font-medium">{(patient.emergencyContact as string) || "-"}</p></div>
            <div><p className="text-xs text-gray-500">Address</p><p className="font-medium">{(patient.address as string) || "-"}</p></div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Personal</h3>
            <div><p className="text-xs text-gray-500">Age</p><p className="font-medium">{patient.age ? `${patient.age} years` : "-"}</p></div>
            <div><p className="text-xs text-gray-500">Gender</p><p className="font-medium capitalize">{(patient.gender as string) || "-"}</p></div>
            <div><p className="text-xs text-gray-500">Blood Group</p><p className="font-medium">{(patient.bloodGroup as string) || "-"}</p></div>
          </div>
          <div className="sm:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Medical</h3>
            <div><p className="text-xs text-gray-500">Medical History</p><p className="font-medium">{(patient.medicalHistory as string) || "None recorded"}</p></div>
            <div><p className="text-xs text-gray-500">Allergies</p><p className="font-medium">{(patient.allergies as string) || "None recorded"}</p></div>
          </div>
        </div>
      </div>
    </PatientPortalShell>
  );
}
