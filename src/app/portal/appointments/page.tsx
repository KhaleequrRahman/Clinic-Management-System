"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import PatientPortalShell from "@/components/PatientPortalShell";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800", completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800", no_show: "bg-gray-100 text-gray-800",
};

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/appointments").then((r) => r.json()).then((res) => {
      if (res.success) setAppointments(res.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <PatientPortalShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <Link href="/portal/book" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">+ Book New</Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-3">No appointments yet</p>
            <Link href="/portal/book" className="text-green-600 hover:underline text-sm font-medium">Book your first appointment →</Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appointments.map((a) => (
                <tr key={a.id as number} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{a.appointmentDate as string}</div>
                    <div className="text-xs text-gray-500">{a.appointmentTime as string}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{a.doctorName as string}</div>
                    <div className="text-xs text-gray-500">{a.doctorSpecialization as string}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">{(a.reason as string) || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[(a.status as string)] || ""}`}>
                      {(a.status as string).replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PatientPortalShell>
  );
}
