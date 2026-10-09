"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import DoctorShell from "@/components/DoctorShell";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800", completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800", no_show: "bg-gray-100 text-gray-800",
};

export default function DoctorDashboard() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [doctor, setDoctor] = useState<Record<string, unknown> | null>(null);
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    Promise.all([
      fetch("/api/doctor/me").then((r) => r.json()),
      fetch(`/api/doctor/appointments?date=${today}`).then((r) => r.json()),
    ]).then(([meRes, apptRes]) => {
      if (meRes.success) { setStats(meRes.stats); setDoctor(meRes.data); }
      if (apptRes.success) setAppointments(apptRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <DoctorShell><div className="py-12 text-center text-gray-500">Loading...</div></DoctorShell>;

  const todayList = appointments;
  const active = todayList.filter((a) => ["scheduled", "confirmed", "in_progress"].includes(a.status as string));

  return (
    <DoctorShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Good day, Dr. {(doctor?.name as string)?.split(" ").slice(-1)[0] || "Doctor"} 👨‍⚕️</h1>
      <p className="text-gray-500 mb-6">{doctor?.specialization as string}</p>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500">Today&apos;s Patients</p>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-1">{stats?.today ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500">Upcoming</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">{stats?.upcoming ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500">Completed</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{stats?.completed ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500">Total Patients</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stats?.totalPatients ?? 0}</p>
        </div>
      </div>

      {/* Today's schedule */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Schedule</h2>
          <Link href="/doctor/appointments" className="text-sm text-indigo-600 hover:underline">View All →</Link>
        </div>
        {todayList.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No appointments scheduled for today.</p>
        ) : (
          <div className="space-y-2">
            {todayList.map((a) => (
              <Link key={a.id as number} href={`/doctor/appointments/${a.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-mono text-gray-600 w-14">{a.appointmentTime as string}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.patientName as string}</p>
                    <p className="text-xs text-gray-500">{a.patientMobile as string}{a.reason ? ` • ${a.reason as string}` : ""}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[(a.status as string)] || ""}`}>{(a.status as string).replace("_", " ")}</span>
              </Link>
            ))}
          </div>
        )}
        {active.length > 0 && (
          <p className="text-xs text-gray-400 mt-3">{active.length} active right now</p>
        )}
      </div>
    </DoctorShell>
  );
}
