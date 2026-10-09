"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import DoctorShell from "@/components/DoctorShell";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800", completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800", no_show: "bg-gray-100 text-gray-800",
};

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (status) params.set("status", status);
    fetch(`/api/doctor/appointments?${params}`).then((r) => r.json()).then((res) => {
      if (res.success) setAppointments(res.data);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <DoctorShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h1>

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
          <button onClick={load} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Filter</button>
          <button onClick={() => { setDate(""); setStatus(""); setTimeout(load, 0); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">Clear</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden table-responsive">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No appointments found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Reason</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appointments.map((a) => (
                <tr key={a.id as number} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{a.appointmentDate as string}</div>
                    <div className="text-xs text-gray-500">{a.appointmentTime as string}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm text-gray-900">{a.patientName as string}</div>
                    <div className="text-xs text-gray-500">{a.patientMobile as string}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate hidden sm:table-cell">{(a.reason as string) || "-"}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[(a.status as string)] || ""}`}>{(a.status as string).replace("_", " ")}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <Link href={`/doctor/appointments/${a.id}`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DoctorShell>
  );
}
