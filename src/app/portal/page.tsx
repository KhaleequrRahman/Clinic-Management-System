"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import PatientPortalShell from "@/components/PatientPortalShell";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800", completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800", no_show: "bg-gray-100 text-gray-800",
};

export default function PatientPortalDashboard() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/me").then((r) => r.json()),
      fetch("/api/portal/appointments").then((r) => r.json()),
    ]).then(([pRes, aRes]) => {
      if (pRes.success) setProfile(pRes.data);
      if (aRes.success) setAppointments(aRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PatientPortalShell><div className="py-12 text-center text-gray-500">Loading...</div></PatientPortalShell>;

  const upcoming = appointments.filter((a) => ["scheduled", "confirmed"].includes(a.status as string));
  const completed = appointments.filter((a) => a.status === "completed");

  return (
    <PatientPortalShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome, {(profile?.name as string) || "Patient"} 👋
      </h1>
      <p className="text-gray-500 mb-6">Here&apos;s your health overview</p>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Total Visits</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{appointments.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Upcoming</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{upcoming.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{completed.length}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/portal/book" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium">📅 Book Appointment</Link>
          <Link href="/portal/appointments" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">📋 My Appointments</Link>
          <Link href="/portal/prescriptions" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">💊 My Prescriptions</Link>
          <Link href="/portal/profile" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium">👤 My Profile</Link>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Appointments</h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-3">No upcoming appointments</p>
            <Link href="/portal/book" className="text-green-600 hover:underline text-sm font-medium">Book an appointment →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((a) => (
              <div key={a.id as number} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-mono text-gray-600 w-24">{a.appointmentDate as string}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.doctorName as string}</p>
                    <p className="text-xs text-gray-500">{a.doctorSpecialization as string} • {a.appointmentTime as string}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[(a.status as string)] || ""}`}>{(a.status as string).replace("_", " ")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientPortalShell>
  );
}
