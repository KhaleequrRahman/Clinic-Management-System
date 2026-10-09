"use client";

import { useState, useEffect } from "react";
import DoctorShell from "@/components/DoctorShell";

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/doctor/patients").then((r) => r.json()).then((res) => {
      if (res.success) setPatients(res.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <DoctorShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Patients</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden table-responsive">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No patients seen yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Age / Gender</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Blood</th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visits</th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.map((p) => (
                <tr key={p.patientId as number} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold">{(p.patientName as string).charAt(0).toUpperCase()}</div>
                      <span className="text-sm font-medium text-gray-900">{p.patientName as string}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">{p.patientMobile as string}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{p.patientAge ? `${p.patientAge}` : "-"} / {String(p.patientGender || "-")}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{String(p.patientBloodGroup || "-")}</td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{p.visits as number}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right text-sm text-gray-600">{(p.lastVisit as string) || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DoctorShell>
  );
}
