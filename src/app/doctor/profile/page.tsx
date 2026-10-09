"use client";

import { useState, useEffect } from "react";
import DoctorShell from "@/components/DoctorShell";

export default function DoctorProfilePage() {
  const [doctor, setDoctor] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/doctor/me").then((r) => r.json()).then((res) => {
      if (res.success) { setDoctor(res.data); setStats(res.stats); }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <DoctorShell><div className="py-12 text-center text-gray-500">Loading...</div></DoctorShell>;
  if (!doctor) return <DoctorShell><div className="py-12 text-center text-red-500">Could not load profile.</div></DoctorShell>;

  return (
    <DoctorShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-indigo-600 text-2xl font-bold">
              {String(doctor.name).charAt(0).toUpperCase()}
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">{doctor.name as string}</h2>
              <p className="text-indigo-100">{doctor.specialization as string}</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Contact</h3>
            <div><p className="text-xs text-gray-500">Mobile</p><p className="font-medium">{doctor.mobile as string}</p></div>
            <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{(doctor.email as string) || "-"}</p></div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Professional</h3>
            <div><p className="text-xs text-gray-500">Specialization</p><p className="font-medium">{doctor.specialization as string}</p></div>
            <div><p className="text-xs text-gray-500">Qualification</p><p className="font-medium">{(doctor.qualification as string) || "-"}</p></div>
            <div><p className="text-xs text-gray-500">Experience</p><p className="font-medium">{doctor.experience ? `${String(doctor.experience)} years` : "-"}</p></div>
            <div><p className="text-xs text-gray-500">Consultation Fee</p><p className="font-medium text-lg text-green-600">₹{doctor.fee as string}</p></div>
          </div>
          {Boolean(doctor.bio) && (
            <div className="sm:col-span-2 space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase">About</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{doctor.bio as string}</p>
            </div>
          )}
        </div>

        {stats && (
          <div className="border-t px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center"><p className="text-xs text-gray-500">Today</p><p className="text-lg font-bold text-indigo-600">{stats.today}</p></div>
            <div className="text-center"><p className="text-xs text-gray-500">Upcoming</p><p className="text-lg font-bold text-blue-600">{stats.upcoming}</p></div>
            <div className="text-center"><p className="text-xs text-gray-500">Completed</p><p className="text-lg font-bold text-green-600">{stats.completed}</p></div>
            <div className="text-center"><p className="text-xs text-gray-500">Patients</p><p className="text-lg font-bold text-gray-900">{stats.totalPatients}</p></div>
          </div>
        )}
      </div>
    </DoctorShell>
  );
}
