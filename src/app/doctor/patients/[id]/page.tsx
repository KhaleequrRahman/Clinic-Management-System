"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import DoctorShell from "@/components/DoctorShell";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800", completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800", no_show: "bg-gray-100 text-gray-800",
};

export default function DoctorPatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/doctor/patients/${patientId}`).then((r) => r.json()).then((res) => {
      if (res.success) setData(res.data);
      else setError(res.error || "Failed to load");
    }).catch(() => setError("Failed to load")).finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <DoctorShell><div className="py-12 text-center text-gray-500">Loading...</div></DoctorShell>;
  if (!data) return <DoctorShell><div className="py-12 text-center"><p className="text-red-500 mb-4">{error}</p><Link href="/doctor/patients" className="text-indigo-600">← Back to My Patients</Link></div></DoctorShell>;

  const patient = data.patient as Record<string, unknown>;
  const visits = data.visits as Record<string, unknown>[];

  return (
    <DoctorShell>
      <Link href="/doctor/patients" className="text-indigo-600 hover:text-indigo-700 text-sm">← Back to My Patients</Link>

      <div className="bg-white rounded-xl shadow overflow-hidden mt-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-600 text-2xl font-bold">
              {(patient.name as string).charAt(0).toUpperCase()}
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold">{patient.name as string}</h1>
              <p className="text-blue-100 text-sm">{patient.mobile as string} • {patient.age ? `${patient.age} yrs` : "-"} • {(patient.gender as string) || "-"}</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Contact</h3>
            <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{(patient.email as string) || "-"}</p></div>
            <div><p className="text-xs text-gray-500">Emergency</p><p className="font-medium">{(patient.emergencyContact as string) || "-"}</p></div>
            <div><p className="text-xs text-gray-500">Address</p><p className="font-medium">{(patient.address as string) || "-"}</p></div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Medical</h3>
            <div><p className="text-xs text-gray-500">Blood Group</p><p className="font-medium">{(patient.bloodGroup as string) || "-"}</p></div>
            <div><p className="text-xs text-gray-500">Medical History</p><p className="font-medium whitespace-pre-wrap">{(patient.medicalHistory as string) || "None recorded"}</p></div>
            <div><p className="text-xs text-gray-500">Allergies</p><p className="font-medium whitespace-pre-wrap">{(patient.allergies as string) || "None recorded"}</p></div>
          </div>
        </div>
      </div>

      {/* Visit history with this doctor */}
      <div className="bg-white rounded-xl shadow p-5 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Visits with You ({visits.length})</h2>
        {visits.length === 0 ? (
          <p className="text-sm text-gray-500">No visits recorded.</p>
        ) : (
          <div className="space-y-2">
            {visits.map((v) => (
              <Link key={v.id as number} href={`/doctor/appointments/${v.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-mono text-gray-600 w-24">{v.appointmentDate as string}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{v.appointmentTime as string}</p>
                    {(v.diagnosis as string) && <p className="text-xs text-gray-500 truncate max-w-[200px]">{v.diagnosis as string}</p>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[(v.status as string)] || ""}`}>{(v.status as string).replace("_", " ")}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DoctorShell>
  );
}
